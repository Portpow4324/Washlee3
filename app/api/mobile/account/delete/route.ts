import { NextRequest } from "next/server";
import {
  getMobileClients,
  getMobileUser,
  mobileJson,
  mobileOptions,
  readString,
} from "@/lib/mobileBackend";

export async function OPTIONS() {
  return mobileOptions();
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getMobileUser(request);
    if (authError || !user) {
      return mobileJson({ success: false, error: authError }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const reason = readString(body, ["reason"]);
    const { admin } = getMobileClients();
    const now = new Date().toISOString();

    await admin.from("account_deletion_requests").insert({
      user_id: user.id,
      email: user.email || null,
      reason: reason || null,
      status: "completed",
      requested_at: now,
      completed_at: now,
    });

    const activeStatuses = [
      "pending",
      "pending_payment",
      "confirmed",
      "assigned",
      "pickup",
      "picked_up",
      "cleaning",
      "in_transit",
    ];

    const { error: orderError } = await admin
      .from("orders")
      .update({
        cancellation_reason: "Account deleted by customer",
        updated_at: now,
      })
      .eq("user_id", user.id)
      .in("status", activeStatuses);
    if (orderError) {
      console.warn(
        "[Mobile Account Delete] Active order note failed:",
        orderError.message,
      );
    }

    const { error: tokenError } = await admin
      .from("device_tokens")
      .update({ is_active: false, updated_at: now })
      .eq("user_id", user.id);
    if (tokenError) {
      console.warn(
        "[Mobile Account Delete] Device token cleanup failed:",
        tokenError.message,
      );
    }

    const { error: customerError } = await admin
      .from("customers")
      .update({
        deleted_at: now,
        delivery_address: null,
        preferences: {},
        updated_at: now,
      })
      .eq("id", user.id);
    if (customerError) {
      console.warn(
        "[Mobile Account Delete] Customer anonymise failed:",
        customerError.message,
      );
    }

    const { error: userError } = await admin
      .from("users")
      .update({
        name: "Deleted user",
        phone: null,
        deleted_at: now,
        deletion_requested_at: now,
        updated_at: now,
      })
      .eq("id", user.id);
    if (userError) {
      console.warn(
        "[Mobile Account Delete] User anonymise failed:",
        userError.message,
      );
    }

    const { error: deleteAuthError } = await admin.auth.admin.deleteUser(
      user.id,
    );
    if (deleteAuthError) {
      console.warn(
        "[Mobile Account Delete] Auth delete failed:",
        deleteAuthError.message,
      );
      return mobileJson({
        success: true,
        status: "requested",
        warning:
          "Account deletion was recorded; auth removal needs admin review.",
      });
    }

    return mobileJson({ success: true, status: "deleted" });
  } catch (error) {
    console.error("[Mobile Account Delete] Unexpected error:", error);
    return mobileJson(
      { success: false, error: "Failed to delete account" },
      { status: 500 },
    );
  }
}
