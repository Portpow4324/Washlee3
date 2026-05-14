import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { findLinkedEmployee } from "@/lib/mobileBackend";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function getAuthenticatedUser(request: NextRequest) {
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!token)
    return { user: null, userId: null, error: "Missing authorization token" };

  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data, error } = await supabaseAuth.auth.getUser(token);

  if (error || !data.user)
    return { user: null, userId: null, error: "Invalid or expired token" };
  return { user: data.user, userId: data.user.id, error: null };
}

async function getEmployeeAccess(user: { id: string; email?: string | null }) {
  const { employee, error } = await findLinkedEmployee(supabaseAdmin, user);
  if (error) {
    console.error("[Earnings] Employee access lookup failed:", error.message);
    return {
      allowed: false,
      employeeId: "",
      error: "Could not verify your Pro profile",
    };
  }

  return {
    allowed: Boolean(employee),
    employeeId: employee?.id || "",
    error: employee ? null : "Pro access is required",
  };
}

function getTimeframeRange(timeframe: string) {
  const now = new Date();
  let startDate = new Date();

  switch (timeframe) {
    case "week":
      startDate.setDate(now.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(now.getMonth() - 1);
      break;
    case "all":
      startDate = new Date("2000-01-01"); // Start from very old date
      break;
    default:
      startDate.setDate(now.getDate() - 7);
  }

  return startDate.toISOString();
}

export async function GET(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if (auth.error || !auth.user || !auth.userId) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");
  const timeframe = searchParams.get("timeframe") || "week";

  if (!employeeId) {
    return NextResponse.json(
      { error: "Missing employeeId parameter" },
      { status: 400 },
    );
  }

  const employeeAccess = await getEmployeeAccess(auth.user);
  if (!employeeAccess.allowed) {
    return NextResponse.json(
      { success: false, error: employeeAccess.error },
      { status: 403 },
    );
  }

  if (employeeId !== auth.userId && employeeId !== employeeAccess.employeeId) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 },
    );
  }
  const resolvedEmployeeId = employeeAccess.employeeId;

  try {
    const startDate = getTimeframeRange(timeframe);

    // Fetch orders for this employee within the timeframe
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from("orders")
      .select("id, earnings, status, created_at")
      .eq("employee_id", resolvedEmployeeId)
      .gte("created_at", startDate)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Orders fetch error:", ordersError);
      return NextResponse.json(
        { error: "Failed to fetch earnings data" },
        { status: 500 },
      );
    }

    // Calculate earnings breakdown
    const completedOrders =
      orders?.filter((o) => o.status === "completed") || [];
    const pendingOrders = orders?.filter((o) => o.status !== "completed") || [];

    const paidEarnings = completedOrders.reduce((sum, o) => {
      const earning = parseFloat(o.earnings?.toString() || "0");
      return sum + (isNaN(earning) ? 0 : earning);
    }, 0);

    const pendingEarnings = pendingOrders.reduce((sum, o) => {
      const earning = parseFloat(o.earnings?.toString() || "0");
      return sum + (isNaN(earning) ? 0 : earning);
    }, 0);

    const totalEarnings = paidEarnings + pendingEarnings;

    return NextResponse.json({
      success: true,
      data: {
        total: parseFloat(totalEarnings.toFixed(2)),
        paid: parseFloat(paidEarnings.toFixed(2)),
        pending: parseFloat(pendingEarnings.toFixed(2)),
        orders: completedOrders.length,
        pendingOrders: pendingOrders.length,
        timeframe: timeframe,
      },
    });
  } catch (error) {
    console.error("Earnings calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate earnings" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuthenticatedUser(request);
  if (auth.error || !auth.user || !auth.userId) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: 401 },
    );
  }

  try {
    const { employeeId, startDate, endDate } = await request.json();

    if (!employeeId) {
      return NextResponse.json(
        { error: "Missing employeeId" },
        { status: 400 },
      );
    }

    const employeeAccess = await getEmployeeAccess(auth.user);
    if (!employeeAccess.allowed) {
      return NextResponse.json(
        { success: false, error: employeeAccess.error },
        { status: 403 },
      );
    }

    if (
      employeeId !== auth.userId &&
      employeeId !== employeeAccess.employeeId
    ) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }
    const resolvedEmployeeId = employeeAccess.employeeId;

    // Fetch transactions for statement generation
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id, order_id, earnings, status, created_at, customer_name, services",
      )
      .eq("employee_id", resolvedEmployeeId)
      .gte("created_at", startDate || "2000-01-01")
      .lte("created_at", endDate || new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Statement fetch error:", error);
      return NextResponse.json(
        { error: "Failed to generate statement" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error("Statement error:", error);
    return NextResponse.json(
      { error: "Failed to generate statement" },
      { status: 500 },
    );
  }
}
