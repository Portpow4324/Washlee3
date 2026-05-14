import { NextRequest } from "next/server";
import {
  findLinkedEmployee,
  getMobileClients,
  getMobileUser,
  insertNotification,
  mobileJson,
  mobileOptions,
  readString,
} from "@/lib/mobileBackend";

function orderProId(order: Record<string, unknown>) {
  return readString(order, ["pro_id", "employee_id", "assigned_pro_id"]);
}

function isCustomerForOrder(order: Record<string, unknown>, userId: string) {
  return readString(order, ["user_id", "customer_id"]) === userId;
}

function cleanMessage(value: unknown) {
  return String(value || "")
    .replace(/\s+\n/g, "\n")
    .trim();
}

async function loadOrder(
  admin: ReturnType<typeof getMobileClients>["admin"],
  orderId: string,
) {
  const { data, error } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw error;
  return data as Record<string, unknown> | null;
}

async function resolveParticipant(request: NextRequest, orderId: string) {
  const { user, error: authError } = await getMobileUser(request);
  if (authError || !user) {
    return { error: authError || "Unauthorized", status: 401 } as const;
  }

  const { admin } = getMobileClients();
  const order = await loadOrder(admin, orderId);
  if (!order) return { error: "Order not found", status: 404 } as const;

  if (isCustomerForOrder(order, user.id)) {
    return { admin, order, user, role: "customer" as const };
  }

  const { employee, error: employeeError } = await findLinkedEmployee(
    admin,
    user,
  );
  if (employeeError) throw employeeError;

  const employeeId = readString(employee || null, ["id"]);
  const assignedProId = orderProId(order);
  if (
    employeeId &&
    (assignedProId === employeeId || assignedProId === user.id)
  ) {
    return { admin, order, user, role: "pro" as const, employeeId };
  }

  return { error: "Forbidden", status: 403 } as const;
}

export async function OPTIONS() {
  return mobileOptions();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    if (!orderId) {
      return mobileJson(
        { success: false, error: "Order ID is required" },
        { status: 400 },
      );
    }

    const participant = await resolveParticipant(request, orderId);
    if ("error" in participant) {
      return mobileJson(
        { success: false, error: participant.error },
        { status: participant.status },
      );
    }

    const { data, error } = await participant.admin
      .from("order_messages")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return mobileJson({ success: true, data: data || [] });
  } catch (error) {
    console.error("[Mobile Order Messages] GET failed:", error);
    return mobileJson(
      { success: false, error: "Failed to load order messages" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    if (!orderId) {
      return mobileJson(
        { success: false, error: "Order ID is required" },
        { status: 400 },
      );
    }

    const participant = await resolveParticipant(request, orderId);
    if ("error" in participant) {
      return mobileJson(
        { success: false, error: participant.error },
        { status: participant.status },
      );
    }

    const body = await request.json();
    const message = cleanMessage(body.message || body.text);
    if (message.length < 1 || message.length > 2000) {
      return mobileJson(
        {
          success: false,
          error: "Message must be between 1 and 2000 characters",
        },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const senderId =
      participant.role === "pro"
        ? participant.employeeId || participant.user.id
        : participant.user.id;

    const { data: inserted, error } = await participant.admin
      .from("order_messages")
      .insert({
        order_id: orderId,
        sender_id: senderId,
        sender_role: participant.role,
        message,
        created_at: now,
      })
      .select()
      .single();

    if (error) throw error;

    const customerId = readString(participant.order, [
      "user_id",
      "customer_id",
    ]);
    const proId = orderProId(participant.order);
    const recipientId = participant.role === "customer" ? proId : customerId;
    if (recipientId) {
      const recipientIsPro = participant.role === "customer";
      await insertNotification(participant.admin, {
        userId: recipientId,
        type: "order_message",
        title: recipientIsPro ? "Customer message" : "Pro message",
        message:
          message.length > 120
            ? `${message.substring(0, 117).trim()}...`
            : message,
        data: {
          orderId,
          notificationType: "order_message",
          route: recipientIsPro
            ? `/pro/orders/${orderId}/messages`
            : `/orders/${orderId}/messages`,
        },
      });
    }

    return mobileJson({ success: true, data: inserted });
  } catch (error) {
    console.error("[Mobile Order Messages] POST failed:", error);
    return mobileJson(
      { success: false, error: "Failed to send message" },
      { status: 500 },
    );
  }
}
