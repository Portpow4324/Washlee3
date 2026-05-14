import { NextRequest } from "next/server";
import {
  getMobileClients,
  getMobileUser,
  insertNotification,
  mobileJson,
  mobileOptions,
  readString,
} from "@/lib/mobileBackend";

function clean(value: unknown) {
  return String(value || "").trim();
}

function supportUserIds() {
  return (
    process.env.WASHLEE_SUPPORT_USER_IDS ||
    process.env.ADMIN_USER_IDS ||
    ""
  )
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

async function notifySupportTeam(
  admin: ReturnType<typeof getMobileClients>["admin"],
  ticketId: string,
  topic: string,
  requesterName: string,
) {
  for (const userId of supportUserIds()) {
    await insertNotification(admin, {
      userId,
      type: "support_ticket_created",
      title: "New support ticket",
      message: `${requesterName || "A Washlee user"} needs help: ${topic}`,
      data: {
        ticketId,
        notificationType: "support_ticket_created",
        route: "/admin/support-tickets",
      },
    });
  }
}

export async function OPTIONS() {
  return mobileOptions();
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getMobileUser(request);
    if (authError || !user)
      return mobileJson({ success: false, error: authError }, { status: 401 });

    const body = await request.json();
    const topic = clean(body.topic || body.inquiryType || "Support request");
    const message = clean(body.message || body.details);
    const orderId = clean(body.orderId || body.order_id);
    const role = clean(body.role || "customer").toLowerCase();

    if (message.length < 10 || message.length > 4000) {
      return mobileJson(
        {
          success: false,
          error: "Add a message between 10 and 4000 characters",
        },
        { status: 400 },
      );
    }

    const { admin } = getMobileClients();
    const { data: profile } = await admin
      .from("users")
      .select("id,email,name,phone,user_type")
      .eq("id", user.id)
      .maybeSingle();

    const metadata =
      user.user_metadata && typeof user.user_metadata === "object"
        ? (user.user_metadata as Record<string, unknown>)
        : {};

    const name = readString(
      profile || metadata,
      ["name", "full_name", "displayName", "first_name"],
      user.email?.split("@")[0] || "Washlee user",
    );
    const email = readString(profile || null, ["email"], user.email || "");
    const phone = readString(profile || metadata, ["phone", "phone_number"]);
    const now = new Date().toISOString();
    const adminMessage = [
      `Role: ${role || "customer"}`,
      ...(orderId ? [`Order: ${orderId}`] : []),
      `Source: mobile app`,
      "",
      message,
    ].join("\n");

    const fullPayload = {
      type: "customer_inquiry",
      user_id: user.id,
      email,
      name,
      phone,
      inquiry_type: topic,
      message: adminMessage,
      status: "pending",
      submitted_at: now,
      updated_at: now,
      source: "mobile",
      role: role || "customer",
      order_id: orderId || null,
    };

    let { data, error } = await admin
      .from("inquiries")
      .insert(fullPayload)
      .select()
      .single();

    if (error) {
      const fallbackPayload = {
        type: "customer_inquiry",
        user_id: user.id,
        email,
        name,
        phone,
        inquiry_type: topic,
        message: adminMessage,
        status: "pending",
        submitted_at: now,
      };
      const fallback = await admin
        .from("inquiries")
        .insert(fallbackPayload)
        .select()
        .single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;

    const ticketId = readString(data || null, ["id"]);
    if (ticketId) {
      await notifySupportTeam(admin, ticketId, topic, name);
    }

    return mobileJson({ success: true, data });
  } catch (error) {
    console.error("[Mobile Support Tickets] POST failed:", error);
    return mobileJson(
      { success: false, error: "Failed to create support ticket" },
      { status: 500 },
    );
  }
}
