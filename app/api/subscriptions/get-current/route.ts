import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabaseFactory";
import { getMobileUser } from "@/lib/mobileBackend";

async function resolveUserId(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { userId: null, error: "Unauthorized", status: 401 };
  }

  const bearerValue = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!bearerValue)
    return { userId: null, error: "Invalid user ID", status: 400 };

  // Website pages currently pass the user id directly. The mobile app passes
  // a Supabase JWT, so decode that path without breaking the website caller.
  if (!bearerValue.includes(".")) {
    return { userId: bearerValue, error: null, status: 200 };
  }

  const { user, error } = await getMobileUser(request);
  if (error || !user)
    return { userId: null, error: error || "Unauthorized", status: 401 };
  return { userId: user.id, error: null, status: 200 };
}

export async function GET(request: NextRequest) {
  try {
    const { userId, error: authError, status } = await resolveUserId(request);
    if (authError || !userId)
      return NextResponse.json({ error: authError }, { status });

    const supabase = getSupabaseAdminClient();

    // Fetch subscription with timeout to prevent lock issues
    try {
      const { data: subscriptions, error } = await Promise.race([
        supabase
          .from("subscriptions")
          .select(
            "id, plan_id, status, current_period_start, current_period_end, stripe_customer_id, created_at",
          )
          .eq("user_id", userId)
          .eq("status", "active")
          .single(),
        new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error("Query timeout")), 5000),
        ),
      ]);

      // If no active subscription, return null
      if (error && (error as any).code === "PGRST116") {
        return NextResponse.json({ subscription: null }, { status: 200 });
      }

      if (error) {
        console.error("[Get Current Subscription] Error:", error);
        // Return null subscription instead of error to avoid blocking UI
        return NextResponse.json({ subscription: null }, { status: 200 });
      }

      return NextResponse.json(
        { subscription: subscriptions || null },
        { status: 200 },
      );
    } catch (queryError: any) {
      console.error("[Get Current Subscription] Query error:", queryError);
      // Return null subscription to avoid blocking UI
      return NextResponse.json({ subscription: null }, { status: 200 });
    }
  } catch (error: any) {
    console.error("[Get Current Subscription] Unexpected error:", error);
    // Return null subscription instead of error to prevent UI blocking
    return NextResponse.json(
      { subscription: null, error: error?.message },
      { status: 200 },
    );
  }
}
