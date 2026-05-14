import { NextRequest, NextResponse } from "next/server";
import { findLinkedEmployee } from "@/lib/mobileBackend";
import { getBearerUser } from "@/lib/security/apiAuth";
import { getServiceRoleClient } from "@/lib/supabaseClientFactory";

function normalizeEmployeeId(value: unknown) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function isAcceptedEmployeeId(value: string) {
  return (
    /^\d{6}$/.test(value) ||
    /^[0-9A-F]{8}-[0-9A-F]{4}-[1-5][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/.test(
      value,
    ) ||
    /^EMP-\d+-[A-Z0-9]+$/.test(value) ||
    /^PS-\d{8}-[A-Z0-9]+$/.test(value)
  );
}

export async function POST(request: NextRequest) {
  try {
    const user = await getBearerUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Please sign in before switching to Pro." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const employeeId = normalizeEmployeeId(body.employeeId);

    if (!employeeId || !isAcceptedEmployeeId(employeeId)) {
      return NextResponse.json(
        { success: false, error: "Enter your 6-digit Pro ID." },
        { status: 400 },
      );
    }

    const supabase = getServiceRoleClient();
    const { employee, error } = await findLinkedEmployee(supabase, user);

    if (error) {
      console.error("[Pro Switch] Employee lookup failed:", error.message);
      return NextResponse.json(
        { success: false, error: "Could not verify your Pro profile." },
        { status: 500 },
      );
    }

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: "No Washlee Pro profile is linked to this account.",
        },
        { status: 403 },
      );
    }

    const storedEmployeeId = normalizeEmployeeId(employee.employee_id);
    const storedUuid = normalizeEmployeeId(employee.id);

    if (employeeId !== storedEmployeeId && employeeId !== storedUuid) {
      return NextResponse.json(
        { success: false, error: "That Pro ID does not match this account." },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email || employee.email,
        firstName: employee.first_name,
        lastName: employee.last_name,
        userType: "pro",
      },
      employee: {
        id: employee.id,
        employeeId: employee.employee_id,
        email: employee.email,
        firstName: employee.first_name,
        lastName: employee.last_name,
      },
    });
  } catch (error) {
    console.error("[Pro Switch] Error:", error);
    return NextResponse.json(
      { success: false, error: "Could not switch to Pro mode." },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getBearerUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Please sign in before checking Pro access." },
        { status: 401 },
      );
    }

    const supabase = getServiceRoleClient();
    const { employee, error } = await findLinkedEmployee(supabase, user);

    if (error) {
      console.error(
        "[Pro Switch] Employee eligibility lookup failed:",
        error.message,
      );
      return NextResponse.json(
        { success: false, error: "Could not verify your Pro profile." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      eligible: Boolean(employee),
      employee: employee
        ? {
            id: employee.id,
            employeeId: employee.employee_id,
            email: employee.email,
            firstName: employee.first_name,
            lastName: employee.last_name,
          }
        : null,
    });
  } catch (error) {
    console.error("[Pro Switch] Eligibility error:", error);
    return NextResponse.json(
      { success: false, error: "Could not verify your Pro profile." },
      { status: 500 },
    );
  }
}
