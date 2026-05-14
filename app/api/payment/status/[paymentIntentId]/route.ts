import { NextRequest } from "next/server";
import {
  getMobileClients,
  getMobileUser,
  mobileJson,
  mobileOptions,
} from "@/lib/mobileBackend";

export async function OPTIONS() {
  return mobileOptions();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentIntentId: string }> },
) {
  try {
    const { user, error: authError } = await getMobileUser(request);
    if (authError || !user)
      return mobileJson({ success: false, error: authError }, { status: 401 });

    const { paymentIntentId } = await params;
    const { admin } = getMobileClients();
    const { data, error } = await admin
      .from("transactions")
      .select(
        "id, order_id, amount, currency, payment_method, status, created_at, stripe_transaction_id",
      )
      .eq("user_id", user.id)
      .eq("stripe_transaction_id", paymentIntentId)
      .maybeSingle();

    if (error) {
      console.error("[Mobile Payment Status] Fetch failed:", error.message);
      return mobileJson(
        { success: false, error: "Failed to fetch payment status" },
        { status: 500 },
      );
    }

    if (!data)
      return mobileJson(
        { success: false, error: "Payment not found" },
        { status: 404 },
      );

    return mobileJson({
      success: true,
      payment: {
        id: data.id,
        order_id: data.order_id || "",
        amount: Number(data.amount || 0),
        currency: data.currency || "AUD",
        payment_method: data.payment_method || "stripe",
        status: data.status || "pending",
        created_at: data.created_at,
      },
      data: {
        id: data.id,
        order_id: data.order_id || "",
        amount: Number(data.amount || 0),
        currency: data.currency || "AUD",
        payment_method: data.payment_method || "stripe",
        status: data.status || "pending",
        created_at: data.created_at,
      },
    });
  } catch (error) {
    console.error("[Mobile Payment Status] Unexpected error:", error);
    return mobileJson(
      { success: false, error: "Failed to fetch payment status" },
      { status: 500 },
    );
  }
}
