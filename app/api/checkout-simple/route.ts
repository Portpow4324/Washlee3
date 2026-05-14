import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  calculateBookingQuote,
  getMobilePricingConfig,
} from "@/lib/mobilePricing";

const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "promo",
  "ref",
  "channel",
  "campaign_id",
  "landing_page",
  "first_utm_source",
  "first_utm_medium",
  "first_utm_campaign",
] as const;

function sanitizeAttribution(input: unknown): Record<string, string> {
  if (!input || typeof input !== "object") return {};
  const source = input as Record<string, unknown>;
  const result: Record<string, string> = {};

  ATTRIBUTION_KEYS.forEach((key) => {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      result[key] = value.trim().slice(0, 500);
    }
  });

  return result;
}

export async function POST(request: NextRequest) {
  console.log("[CHECKOUT-SIMPLE] ===== NEW CHECKOUT REQUEST =====");
  try {
    const body = await request.json();
    console.log("[CHECKOUT-SIMPLE] Request received:", {
      orderId: body.orderId,
      amount: body.amount,
      email: body.email,
    });

    // Log full booking details if provided
    if (body.bookingDetails) {
      console.log("[CHECKOUT-SIMPLE] Booking Details Received:", {
        bagCount: body.bookingDetails.bagCount,
        estimatedWeight: body.bookingDetails.estimatedWeight,
        deliverySpeed: body.bookingDetails.deliverySpeed,
        protectionPlan: body.bookingDetails.protectionPlan,
        customWeight: body.bookingDetails.customWeight,
      });
    }

    // Validate input
    if (!body.amount || typeof body.amount !== "number" || body.amount < 1) {
      console.log("[CHECKOUT-SIMPLE] Invalid amount:", body.amount);
      return NextResponse.json(
        { success: false, error: "Invalid amount" },
        { status: 400 },
      );
    }
    if (!body.email) {
      console.log("[CHECKOUT-SIMPLE] Missing email");
      return NextResponse.json(
        { success: false, error: "Email required" },
        { status: 400 },
      );
    }

    // Initialize Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("[CHECKOUT-SIMPLE] STRIPE_SECRET_KEY not set");
      return NextResponse.json(
        { success: false, error: "Stripe not configured" },
        { status: 500 },
      );
    }

    console.log("[CHECKOUT-SIMPLE] Initializing Stripe...");
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Get the actual host from the request to handle localhost:3000, localhost:3001, or production URL
    const forwardedProto =
      request.headers.get("x-forwarded-proto") || request.headers.get("scheme");
    const forwardedHost = request.headers.get("x-forwarded-host");
    const requestHost = request.headers.get("host");

    // For localhost development, use the actual request host (which will be localhost:3000 or localhost:3001)
    // For production, prefer x-forwarded-* headers from reverse proxy
    let baseUrl: string;

    if (forwardedProto && forwardedHost) {
      // Production: behind reverse proxy
      const cleanHost = forwardedHost.split(",")[0].trim();
      baseUrl = `${forwardedProto}://${cleanHost}`;
    } else if (requestHost) {
      // Development: direct request
      baseUrl = `http://${requestHost}`;
    } else {
      // Fallback
      baseUrl = "http://localhost:3000";
    }

    console.log("[CHECKOUT-SIMPLE] Base URL determined:");
    console.log("[CHECKOUT-SIMPLE]   - x-forwarded-proto:", forwardedProto);
    console.log("[CHECKOUT-SIMPLE]   - x-forwarded-host:", forwardedHost);
    console.log("[CHECKOUT-SIMPLE]   - request host:", requestHost);
    console.log("[CHECKOUT-SIMPLE]   - final URL:", baseUrl);

    // Build line items with detailed breakdown
    console.log(
      "[CHECKOUT-SIMPLE] Creating Stripe session for $" + body.amount,
    );
    console.log("[CHECKOUT-SIMPLE] Protection Plan:", body.protectionPlan);

    const lineItems: any[] = [];
    const bookingDetails = body.bookingDetails || {};
    const marketingAttribution = sanitizeAttribution(
      body.marketingAttribution || bookingDetails.marketingAttribution,
    );
    const pricingConfig = await getMobilePricingConfig();
    const quote = calculateBookingQuote(
      {
        estimatedWeight: bookingDetails.estimatedWeight,
        weight: bookingDetails.weight,
        customWeight: bookingDetails.customWeight,
        bagCount: bookingDetails.bagCount,
        deliverySpeed: bookingDetails.deliverySpeed,
        protectionPlan: bookingDetails.protectionPlan || body.protectionPlan,
        hangDry: bookingDetails.hangDry,
        returnsOnHangers: bookingDetails.returnsOnHangers,
      },
      pricingConfig,
    );

    // Base laundry service
    if (quote.baseSubtotal > 0) {
      lineItems.push({
        price_data: {
          currency: "aud",
          product_data: {
            name: "Laundry Service",
            description: `${quote.estimatedWeight.toFixed(1)}kg @ $${quote.ratePerKg.toFixed(2)}/kg${quote.deliverySpeed === "express" ? " (Express)" : ""}${quote.minimumOrderApplied ? " · minimum order applied" : ""}`,
          },
          unit_amount: Math.round(quote.baseSubtotal * 100),
        },
        quantity: 1,
      });
    }

    // Hang Dry Service
    if (bookingDetails.hangDry) {
      lineItems.push({
        price_data: {
          currency: "aud",
          product_data: {
            name: "Hang Dry Service",
            description: "Hang-dry delicate items",
          },
          unit_amount: Math.round(quote.hangDryPrice * 100),
        },
        quantity: 1,
      });
    }

    if (quote.returnOnHangersPrice > 0) {
      lineItems.push({
        price_data: {
          currency: "aud",
          product_data: {
            name: "Return on Hangers",
            description: "Return selected garments on hangers",
          },
          unit_amount: Math.round(quote.returnOnHangersPrice * 100),
        },
        quantity: 1,
      });
    }

    // Protection Plan
    if (quote.protectionPrice > 0) {
      lineItems.push({
        price_data: {
          currency: "aud",
          product_data: {
            name:
              quote.protectionPlan === "standard"
                ? "Protection Plan - Standard"
                : "Protection Plan - Premium",
            description:
              quote.protectionPlan === "standard"
                ? "Standard damage protection"
                : "Premium damage protection",
          },
          unit_amount: Math.round(quote.protectionPrice * 100),
        },
        quantity: 1,
      });
    }

    // If no line items generated, create a single line item for the total
    if (lineItems.length === 0) {
      lineItems.push({
        price_data: {
          currency: "aud",
          product_data: {
            name: "Washlee Laundry Order",
            description: "Laundry Service",
          },
          unit_amount: Math.round(quote.total * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/booking`,
      customer_email: body.email,
      metadata: {
        orderId: body.orderId || "unknown",
        userId: body.userId || body.customerId || "",
        protectionPlan: quote.protectionPlan,
        quotedTotal: quote.total.toFixed(2),
        ...marketingAttribution,
      },
      payment_intent_data: {
        metadata: {
          orderId: body.orderId || "unknown",
          userId: body.userId || body.customerId || "",
          quotedTotal: quote.total.toFixed(2),
          ...marketingAttribution,
        },
      },
    });

    console.log("[CHECKOUT-SIMPLE] ✅ Session created:", session.id);
    console.log("[CHECKOUT-SIMPLE] Session URL:", session.url);

    return NextResponse.json(
      {
        data: {
          sessionId: session.id,
          url: session.url,
        },
        success: true,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("[CHECKOUT-SIMPLE] ❌ ERROR:", error.message);
    console.error("[CHECKOUT-SIMPLE] Full error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create checkout session",
      },
      { status: 500 },
    );
  }
}
