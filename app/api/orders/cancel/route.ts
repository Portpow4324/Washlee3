import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { sendEmail } from "@/lib/email-service";
import { getBearerUser, hasAdminSession } from "@/lib/security/apiAuth";
import { cleanString } from "@/lib/security/validation";
import { findLinkedEmployee } from "@/lib/mobileBackend";

interface CancellationRequest {
  orderId: string;
  userId?: string;
  reason: string;
  notes?: string;
  actorRole?: string;
}

const REASON_LABELS: Record<string, string> = {
  change_of_mind: "Changed my mind",
  found_alternative: "Found alternative service",
  scheduling_conflict: "Scheduling conflict",
  damaged_items: "Damage to items (requesting refund)",
  quality_issues: "Quality or service issues",
  pro_unavailable: "Pro unavailable",
  customer_unreachable: "Customer unreachable",
  unsafe_access: "Unsafe or blocked access",
  other: "Other reason",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...corsHeaders,
      ...init?.headers,
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body: CancellationRequest = await request.json();
    const orderId = cleanString(body.orderId, 100);
    const requestedUserId = cleanString(body.userId, 80);
    const reason = cleanString(body.reason, 80);
    const notes = cleanString(body.notes, 1000);
    const requestedActorRole = cleanString(body.actorRole, 40);

    if (!orderId || !reason) {
      return json(
        { error: "Missing required fields: orderId, reason" },
        { status: 400 },
      );
    }

    const [authenticatedUser, adminSession] = await Promise.all([
      getBearerUser(request),
      hasAdminSession(request),
    ]);

    if (!adminSession && !authenticatedUser) {
      return json({ error: "Unauthorized" }, { status: 403 });
    }

    console.log("[Cancel API] Processing cancellation:", {
      orderId,
      requestedUserId,
      requestedActorRole,
      reason,
    });

    // Fetch order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("[Cancel API] Order not found:", orderError);
      return json(
        { error: "Order not found or unauthorized" },
        { status: 404 },
      );
    }

    const orderRecord = order as Record<string, any>;
    const customerId = cleanString(
      orderRecord.user_id || orderRecord.customer_id || requestedUserId,
      80,
    );
    const assignedProId = cleanString(
      orderRecord.pro_id ||
        orderRecord.employee_id ||
        orderRecord.assigned_pro_id,
      80,
    );
    const normalizedStatus = cleanString(orderRecord.status, 80)
      .toLowerCase()
      .replace(/-/g, "_");

    if (["cancelled", "completed", "delivered"].includes(normalizedStatus)) {
      return json(
        { error: `This order is already ${orderRecord.status || "closed"}` },
        { status: 400 },
      );
    }

    let linkedEmployeeId = "";
    if (authenticatedUser) {
      const { employee, error: employeeError } = await findLinkedEmployee(
        supabaseAdmin,
        authenticatedUser,
      );
      if (employeeError) {
        console.warn(
          "[Cancel API] Could not check linked employee:",
          employeeError,
        );
      }
      linkedEmployeeId = cleanString(employee?.id || employee?.employee_id, 80);
    }

    const isCustomerRequester =
      Boolean(authenticatedUser) && authenticatedUser!.id === customerId;
    const isAssignedProRequester =
      Boolean(authenticatedUser) &&
      Boolean(assignedProId) &&
      (authenticatedUser!.id === assignedProId ||
        linkedEmployeeId === assignedProId);

    if (!adminSession && !isCustomerRequester && !isAssignedProRequester) {
      return json(
        { error: "Unauthorized to cancel this order" },
        { status: 403 },
      );
    }

    const actorRole = adminSession
      ? "admin"
      : isAssignedProRequester
        ? "pro"
        : requestedActorRole || "customer";
    const actorId = adminSession
      ? ""
      : authenticatedUser?.id || requestedUserId;

    // Fetch customer email
    let customerEmail = "";
    try {
      const { data: authData } =
        await supabaseAdmin.auth.admin.getUserById(customerId);
      customerEmail = authData?.user?.email || "";
    } catch (err) {
      console.error("[Cancel API] Failed to fetch user email:", err);
    }

    // Update order status to cancelled
    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("[Cancel API] Failed to update order:", updateError);
      return json({ error: "Failed to cancel order" }, { status: 500 });
    }

    // Update pro_jobs to cancelled status
    try {
      await supabaseAdmin
        .from("pro_jobs")
        .update({ status: "cancelled" })
        .eq("order_id", orderId);
    } catch (err) {
      console.error("[Cancel API] Failed to cancel pro_jobs:", err);
      // Don't fail - order was already cancelled
    }

    // Try to create cancellation record (table may not exist yet)
    try {
      const cancellationNotes = [
        notes,
        actorRole
          ? `Cancelled by ${actorRole}${actorId ? ` (${actorId})` : ""}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n");

      const { error: cancellationError } = await supabaseAdmin
        .from("order_cancellations")
        .insert({
          order_id: orderId,
          user_id: customerId,
          reason,
          notes: cancellationNotes,
          refund_status: "pending",
          created_at: new Date().toISOString(),
        });
      if (cancellationError) throw cancellationError;
    } catch (err) {
      if (!(err instanceof Error) || !err.message.includes("does not exist")) {
        console.error(
          "[Cancel API] Failed to create cancellation record:",
          err,
        );
      }
    }

    // Send emails
    const reasonLabel = REASON_LABELS[reason] || reason;
    const adminEmail = process.env.ADMIN_EMAIL || "lukaverde045@gmail.com";
    const supportEmail = "support@washlee.com.au";

    console.log("[Cancel API] Attempting to send emails...");
    console.log("[Cancel API] Customer email:", customerEmail);
    console.log("[Cancel API] Admin emails:", adminEmail, supportEmail);

    // Email to customer
    if (customerEmail) {
      const customerEmailSuccess = await sendEmail({
        to: customerEmail,
        subject: `Order Cancelled - #${orderId.slice(0, 8)}`,
        html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #48C9B0;">Order Cancelled</h2>
            <p>Your order <strong>#${orderId.slice(0, 8)}</strong> has been cancelled.</p>
            <p><strong>Cancellation Reason:</strong> ${reasonLabel}</p>
            ${notes ? `<p><strong>Your Details:</strong><br/>${notes}</p>` : ""}
            <p><strong>Order Amount:</strong> $${(order.total_price || 0).toFixed(2)}</p>
            <div style="background: #E8FFFB; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="color: #48C9B0; font-weight: bold;">Refund Status: Pending</p>
              <p style="color: #6b7b78; font-size: 14px;">Our support team will contact you within 24 hours to process your refund.</p>
            </div>
            <p style="color: #6b7b78; font-size: 14px;">If you have any questions, please reply to this email or contact us at <strong>support@washlee.com.au</strong></p>
          </div>
        `,
      });
      console.log("[Cancel API] Customer email result:", customerEmailSuccess);
    } else {
      console.warn(
        "[Cancel API] No customer email found for user:",
        customerId,
      );
    }

    // Email to admin and support
    const adminEmailContent = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #d32f2f;">New Order Cancellation - Action Required</h2>
        <p><strong>Order ID:</strong> ${orderId}</p>
        <p><strong>Customer Email:</strong> ${customerEmail}</p>
        <p><strong>Cancelled By:</strong> ${actorRole}${actorId ? ` (${actorId})` : ""}</p>
        <p><strong>Order Total:</strong> $${(order.total_price || 0).toFixed(2)}</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p><strong>Cancellation Reason:</strong> ${reasonLabel}</p>
        ${notes ? `<p><strong>Customer Notes:</strong><br/><em>${notes}</em></p>` : ""}
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p><strong>Order Details:</strong></p>
        <ul>
          <li><strong>Pickup Address:</strong> ${order.pickup_address || "N/A"}</li>
          <li><strong>Delivery Address:</strong> ${order.delivery_address || "N/A"}</li>
          <li><strong>Scheduled Pickup:</strong> ${order.scheduled_pickup_date ? new Date(order.scheduled_pickup_date).toLocaleDateString("en-AU") : "N/A"}</li>
          <li><strong>Status:</strong> ${order.status}</li>
        </ul>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        ${reason === "damaged_items" ? '<div style="background: #ffebee; padding: 15px; border-left: 4px solid #d32f2f; margin: 20px 0;"><p style="color: #d32f2f; font-weight: bold;">⚠️ URGENT: Customer reported damaged items. Investigate and provide compensation as per damage policy.</p></div>' : ""}
        <p><strong style="color: #d32f2f;">Required Action:</strong> Process refund of <strong>$${(order.total_price || 0).toFixed(2)}</strong> back to customer payment method</p>
      </div>
    `;

    // Send to admin email
    const adminEmailSuccess = await sendEmail({
      to: adminEmail,
      subject: `[CANCELLATION] Order #${orderId.slice(0, 8)} - Refund Required - ${reasonLabel}`,
      html: adminEmailContent,
    });
    console.log(
      "[Cancel API] Admin email to",
      adminEmail,
      "- Result:",
      adminEmailSuccess,
    );

    // Send to support email
    const supportEmailSuccess = await sendEmail({
      to: supportEmail,
      subject: `[CANCELLATION] Order #${orderId.slice(0, 8)} - Refund Required - ${reasonLabel}`,
      html: adminEmailContent,
    });
    console.log(
      "[Cancel API] Support email to",
      supportEmail,
      "- Result:",
      supportEmailSuccess,
    );

    return json({
      success: true,
      message:
        actorRole === "pro"
          ? "Job cancelled successfully. Washlee support has been notified."
          : "Order cancelled successfully. You will receive a confirmation email shortly.",
      orderId,
    });
  } catch (error) {
    console.error("[Cancel API] Error:", error);
    return json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
