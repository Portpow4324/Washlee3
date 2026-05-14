import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getSupabaseAdminClient } from "@/lib/supabaseFactory";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-02-25.clover" as any,
});

export async function GET(request: NextRequest) {
  const supabase = getSupabaseAdminClient();
  return NextResponse.json(
    { success: false, message: "Method not allowed" },
    { status: 405 },
  );
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdminClient();
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing authorization header" },
        { status: 401 },
      );
    }

    // Verify the user token
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, orderId, amount } = body;

    if (action === "create_payment_intent") {
      if (!orderId || !amount) {
        return NextResponse.json(
          { error: "Missing orderId or amount" },
          { status: 400 },
        );
      }

      try {
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .select("id,user_id,total_price,status,payment_status")
          .eq("id", orderId)
          .maybeSingle();

        if (orderError) {
          console.error("Error loading order for payment:", orderError);
          return NextResponse.json(
            { error: "Could not verify order before payment" },
            { status: 500 },
          );
        }

        if (!order) {
          return NextResponse.json(
            { error: "Order not found" },
            { status: 404 },
          );
        }

        if (order.user_id !== user.id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const orderTotal = Number(order.total_price || 0);
        if (!Number.isFinite(orderTotal) || orderTotal <= 0) {
          return NextResponse.json(
            { error: "Order has no payable total" },
            { status: 400 },
          );
        }

        const amountCents = Math.round(orderTotal * 100);

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountCents,
          currency: "aud", // Australian Dollars
          automatic_payment_methods: { enabled: true },
          metadata: {
            orderId,
            userId: user.id,
            customerId: user.id,
          },
        });

        const { error: orderUpdateError } = await supabase
          .from("orders")
          .update({
            payment_status: "pending",
            stripe_payment_intent_id: paymentIntent.id,
            updated_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        if (orderUpdateError) {
          console.error(
            "Error attaching payment intent to order:",
            orderUpdateError,
          );
        }

        // Store payment intent record in Supabase
        const { error: insertError } = await supabase
          .from("transactions")
          .insert({
            order_id: orderId,
            user_id: user.id,
            type: "payment",
            amount: amountCents / 100,
            currency: "AUD",
            payment_method: "stripe",
            status: "pending",
            stripe_transaction_id: paymentIntent.id,
            description: `Washlee order #${String(orderId).slice(0, 8)}`,
            created_at: new Date().toISOString(),
          });

        if (insertError)
          console.error("Error storing transaction:", insertError);

        return NextResponse.json({
          success: true,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        });
      } catch (stripeError: any) {
        console.error("Stripe error:", stripeError);
        return NextResponse.json(
          { error: stripeError.message || "Payment intent creation failed" },
          { status: 500 },
        );
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const supabase = getSupabaseAdminClient();
  return NextResponse.json(
    { success: false, message: "Method not allowed" },
    { status: 405 },
  );
}

export async function PUT(request: NextRequest) {
  const supabase = getSupabaseAdminClient();
  return NextResponse.json(
    { success: false, message: "Method not allowed" },
    { status: 405 },
  );
}

export async function DELETE(request: NextRequest) {
  const supabase = getSupabaseAdminClient();
  return NextResponse.json(
    { success: false, message: "Method not allowed" },
    { status: 405 },
  );
}
