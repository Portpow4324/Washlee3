import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hasAdminSession } from "@/lib/security/apiAuth";
import { cleanString } from "@/lib/security/validation";

const REQUIRED_CONFIRMATION = "DELETE ALL ORDERS";
const CHUNK_SIZE = 250;

interface BulkDeleteRequest {
  confirmation: string;
}

type OrderAuditRow = {
  id: string;
  user_id: string | null;
  pro_id: string | null;
  total_price: number | null;
  status: string | null;
};

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function isMissingTableError(message: string) {
  return /does not exist|schema cache|relation .* not found/i.test(message);
}

async function deleteLinkedRows(
  table: string,
  column: string,
  ids: string[],
  warnings: string[],
) {
  for (const currentIds of chunk(ids, CHUNK_SIZE)) {
    const { error } = await supabaseAdmin
      .from(table)
      .delete()
      .in(column, currentIds);

    if (error) {
      if (!isMissingTableError(error.message)) {
        warnings.push(`${table}: ${error.message}`);
      }
      return;
    }
  }
}

async function writeDeletionAudit(orders: OrderAuditRow[], warnings: string[]) {
  for (const currentOrders of chunk(orders, CHUNK_SIZE)) {
    const { error } = await supabaseAdmin.from("order_deletions").insert(
      currentOrders.map((order) => ({
        order_id: order.id,
        user_id: order.user_id,
        pro_id: order.pro_id,
        order_amount: order.total_price,
        order_status: order.status,
        deleted_at: new Date().toISOString(),
        reason: "admin_bulk_delete",
      })),
    );

    if (error) {
      if (!isMissingTableError(error.message)) {
        warnings.push(`order_deletions: ${error.message}`);
      }
      return;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await hasAdminSession(request))) {
      return NextResponse.json(
        { success: false, error: "Admin session required" },
        { status: 401 },
      );
    }

    const body: BulkDeleteRequest = await request.json();
    const confirmation = cleanString(body.confirmation, 80);

    if (confirmation !== REQUIRED_CONFIRMATION) {
      return NextResponse.json(
        {
          success: false,
          error: `Type ${REQUIRED_CONFIRMATION} to delete every order.`,
        },
        { status: 400 },
      );
    }

    const { data: orders, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, pro_id, total_price, status");

    if (fetchError) {
      console.error(
        "[Admin Orders Bulk Delete] Failed to fetch orders:",
        fetchError,
      );
      return NextResponse.json(
        { success: false, error: "Failed to fetch orders" },
        { status: 500 },
      );
    }

    const orderRows = (orders || []) as OrderAuditRow[];
    const orderIds = orderRows.map((order) => String(order.id)).filter(Boolean);

    if (orderIds.length === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        warnings: [],
      });
    }

    const warnings: string[] = [];

    await deleteLinkedRows("order_messages", "order_id", orderIds, warnings);
    await deleteLinkedRows(
      "payment_confirmations",
      "order_id",
      orderIds,
      warnings,
    );
    await deleteLinkedRows(
      "pro_location_events",
      "order_id",
      orderIds,
      warnings,
    );
    await deleteLinkedRows("pro_jobs", "order_id", orderIds, warnings);
    await deleteLinkedRows(
      "order_cancellations",
      "order_id",
      orderIds,
      warnings,
    );

    let deletedCount = 0;
    for (const currentIds of chunk(orderIds, CHUNK_SIZE)) {
      const { error: deleteError } = await supabaseAdmin
        .from("orders")
        .delete()
        .in("id", currentIds);

      if (deleteError) {
        console.error(
          "[Admin Orders Bulk Delete] Failed to delete orders:",
          deleteError,
        );
        return NextResponse.json(
          {
            success: false,
            error: "Failed to delete all orders",
            deletedCount,
            warnings,
          },
          { status: 500 },
        );
      }

      deletedCount += currentIds.length;
    }

    await writeDeletionAudit(orderRows, warnings);

    return NextResponse.json({
      success: true,
      deletedCount,
      warnings,
    });
  } catch (error) {
    console.error("[Admin Orders Bulk Delete] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
