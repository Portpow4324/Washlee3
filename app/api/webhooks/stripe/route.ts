import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { releasePaidOrderToPros } from "@/lib/supabaseAdmin";
import { sendOrderConfirmationEmail } from "@/lib/emailMarketing";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

function parseRecord(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  return {};
}

function readText(
  source: Record<string, unknown>,
  keys: string[],
  fallback = "",
) {
  for (const key of keys) {
    const value = source[key];
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return fallback;
}

async function sendPaidOrderConfirmationEmail(params: {
  supabase: any;
  orderId: string;
  amountPaid: number;
}) {
  const { supabase, orderId, amountPaid } = params;
  const { data: rawOrder, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !rawOrder) {
    console.warn("[WEBHOOK] Could not load order for confirmation email");
    return;
  }

  const order = rawOrder as Record<string, any>;
  const items = parseRecord(order.items);
  const customerId = readText(order, ["user_id", "customer_id"]);
  const { data: user } = customerId
    ? await supabase
        .from("users")
        .select("email,name,first_name,last_name")
        .eq("id", customerId)
        .maybeSingle()
    : { data: null };
  const email = readText(user || {}, ["email"]);
  if (!email) return;

  const customerName =
    readText(user || {}, ["name"]) ||
    [readText(user || {}, ["first_name"]), readText(user || {}, ["last_name"])]
      .filter(Boolean)
      .join(" ") ||
    email.split("@")[0];

  try {
    await sendOrderConfirmationEmail({
      to: email,
      customerName,
      orderId,
      pickupDate:
        readText(order, ["scheduled_pickup_date", "pickup_date"]) ||
        readText(items, ["pickupDate", "pickup_date"], "To be confirmed"),
      pickupTime: readText(
        items,
        ["pickupSlot", "pickup_slot"],
        "To be confirmed",
      ),
      pickupAddress:
        readText(order, ["pickup_address"]) ||
        readText(items, ["pickupAddress", "pickup_address"], "To be confirmed"),
      totalPrice: amountPaid,
      serviceType:
        readText(order, ["delivery_speed"]) ||
        readText(items, ["deliverySpeed", "selectedService"], "Wash and fold"),
      weight:
        Number(order.weight || items.weight || items.estimatedWeight || 0) ||
        undefined,
      orderUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://washlee.com"}/tracking/${orderId}`,
    });
  } catch (emailError) {
    console.warn("[WEBHOOK] Order confirmation email failed:", emailError);
  }
}

// Verify and process Stripe webhooks
export async function POST(request: NextRequest) {
  console.log("[WEBHOOK] Stripe webhook received");

  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature") || "";

    if (!webhookSecret) {
      console.error("[WEBHOOK] STRIPE_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 },
      );
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log("[WEBHOOK] Signature verified. Event type:", event.type);
    } catch (err: any) {
      console.error("[WEBHOOK] Signature verification failed:", err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 },
      );
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    );

    // Handle different event types
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("[WEBHOOK] Payment completed for session:", session.id);
      console.log("[WEBHOOK] Session metadata:", session.metadata);
      console.log(
        "[WEBHOOK] Amount total:",
        session.amount_total,
        "Currency:",
        session.currency,
      );

      // Extract order info from metadata
      const orderId = session.metadata?.orderId;
      const customerId = session.metadata?.userId || "anonymous";
      const amountPaid = (session.amount_total || 0) / 100; // Convert cents to dollars

      if (orderId) {
        console.log(
          "[WEBHOOK] Updating order status to paid:",
          orderId,
          "Amount:",
          amountPaid,
        );

        // Update order in database with actual payment amount
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            status: "confirmed",
            payment_status: "paid",
            total_price: amountPaid,
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        if (updateError) {
          console.error(
            "[WEBHOOK] Failed to update order:",
            updateError.message,
          );
        } else {
          console.log("[WEBHOOK] ✅ Order updated successfully");
          const releaseResult = await releasePaidOrderToPros(orderId);
          if (releaseResult.error) {
            const releaseError = releaseResult.error as
              | { message?: string }
              | Error;
            console.warn(
              "[WEBHOOK] Paid order was not released to Pros:",
              releaseError instanceof Error
                ? releaseError.message
                : releaseError?.message || releaseResult.error,
            );
          }
        }

        // Log payment confirmation
        const { error: logError } = await supabase
          .from("payment_confirmations")
          .insert({
            order_id: orderId,
            customer_id: customerId,
            stripe_session_id: session.id,
            stripe_payment_intent_id: session.payment_intent,
            payment_status: "confirmed",
            amount: (session.amount_total || 0) / 100,
            currency: session.currency,
            confirmed_at: new Date().toISOString(),
          });

        if (logError) {
          console.warn(
            "[WEBHOOK] Failed to log payment (non-critical):",
            logError.message,
          );
        } else {
          console.log("[WEBHOOK] ✅ Payment logged successfully");
        }
      }
    } else if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata?.orderId;
      const customerId =
        paymentIntent.metadata?.userId ||
        paymentIntent.metadata?.customerId ||
        "anonymous";
      const amountPaid =
        (paymentIntent.amount_received || paymentIntent.amount || 0) / 100;

      if (orderId) {
        console.log(
          "[WEBHOOK] Payment intent succeeded for order:",
          orderId,
          "Amount:",
          amountPaid,
        );

        const { error: updateError } = await supabase
          .from("orders")
          .update({
            status: "confirmed",
            payment_status: "paid",
            total_price: amountPaid,
            stripe_payment_intent_id: paymentIntent.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        if (updateError) {
          console.error(
            "[WEBHOOK] Failed to update order from payment intent:",
            updateError.message,
          );
        } else {
          console.log("[WEBHOOK] ✅ Order marked paid from payment intent");
          const releaseResult = await releasePaidOrderToPros(orderId);
          if (releaseResult.error) {
            const releaseError = releaseResult.error as
              | { message?: string }
              | Error;
            console.warn(
              "[WEBHOOK] Paid order was not released to Pros:",
              releaseError instanceof Error
                ? releaseError.message
                : releaseError?.message || releaseResult.error,
            );
          }
        }

        const { error: transactionError } = await supabase
          .from("transactions")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_transaction_id", paymentIntent.id);

        if (transactionError) {
          console.warn(
            "[WEBHOOK] Failed to update transaction (non-critical):",
            transactionError.message,
          );
        }

        const { error: logError } = await supabase
          .from("payment_confirmations")
          .insert({
            order_id: orderId,
            customer_id: customerId,
            stripe_payment_intent_id: paymentIntent.id,
            payment_status: "confirmed",
            amount: amountPaid,
            currency: paymentIntent.currency,
            confirmed_at: new Date().toISOString(),
          });

        if (logError) {
          console.warn(
            "[WEBHOOK] Failed to log payment intent confirmation (non-critical):",
            logError.message,
          );
        }

        await sendPaidOrderConfirmationEmail({
          supabase,
          orderId,
          amountPaid,
        });
      }
    } else if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log("[WEBHOOK] Payment failed for intent:", paymentIntent.id);

      // Extract metadata
      const metadata = paymentIntent.metadata as any;
      const orderId = metadata?.orderId;

      if (orderId) {
        console.log(
          "[WEBHOOK] Updating order status to payment_failed:",
          orderId,
        );

        const { error: updateError } = await supabase
          .from("orders")
          .update({
            status: "payment_failed",
            payment_status: "failed",
            stripe_payment_intent_id: paymentIntent.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        if (updateError) {
          console.error(
            "[WEBHOOK] Failed to update order:",
            updateError.message,
          );
        } else {
          console.log("[WEBHOOK] ✅ Order marked as payment failed");
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("[WEBHOOK] ❌ Unexpected error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { message: "Webhook endpoint is ready" },
    { status: 200 },
  );
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
