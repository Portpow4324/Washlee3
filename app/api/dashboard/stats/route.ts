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

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getMobileUser(request);
    if (authError || !user)
      return mobileJson({ success: false, error: authError }, { status: 401 });

    const { admin } = getMobileClients();
    const { data, error } = await admin
      .from("orders")
      .select("id, status, total_price")
      .eq("user_id", user.id);

    if (error) {
      console.error("[Mobile Dashboard Stats] Fetch failed:", error.message);
      return mobileJson(
        { success: false, error: "Failed to fetch dashboard stats" },
        { status: 500 },
      );
    }

    const orders = data || [];
    const completedStatuses = new Set(["completed", "delivered"]);
    const activeOrders = orders.filter(
      (order) =>
        !completedStatuses.has(String(order.status || "").toLowerCase()),
    );
    const completedOrders = orders.filter((order) =>
      completedStatuses.has(String(order.status || "").toLowerCase()),
    );
    const totalSpent = orders.reduce((sum, order) => {
      const value = Number(order.total_price || 0);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);

    return mobileJson({
      success: true,
      data: {
        total_orders: orders.length,
        active_orders: activeOrders.length,
        completed_orders: completedOrders.length,
        total_spent: totalSpent,
      },
    });
  } catch (error) {
    console.error("[Mobile Dashboard Stats] Unexpected error:", error);
    return mobileJson(
      { success: false, error: "Failed to fetch dashboard stats" },
      { status: 500 },
    );
  }
}
