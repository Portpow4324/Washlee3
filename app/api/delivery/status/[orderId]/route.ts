/**
 * GET /api/delivery/status/[orderId]
 * Returns customer-safe delivery status, pro assignment, and live pro location
 * when a job is actively assigned.
 */

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { readNumber, readString } from "@/lib/mobileBackend";
import { expireStaleAvailableJobs } from "@/lib/proMatching";

function stageIndex(status: string) {
  const normalized = status.toLowerCase().replace(/[-\s]+/g, "_");
  if (normalized.includes("delivered") || normalized === "completed") return 5;
  if (normalized.includes("transit") || normalized.includes("out_for_delivery"))
    return 4;
  if (
    normalized.includes("clean") ||
    normalized.includes("process") ||
    normalized.includes("wash")
  )
    return 3;
  if (normalized.includes("picked")) return 2;
  if (normalized.includes("pickup")) return 1;
  if (normalized.includes("assigned") || normalized.includes("accepted"))
    return 0;
  return -1;
}

function canShareLiveLocation(status: string) {
  const normalized = status.toLowerCase().replace(/[-\s]+/g, "_");
  return (
    normalized.includes("pickup") ||
    normalized.includes("transit") ||
    normalized.includes("out_for_delivery")
  );
}

function getStatusMessage(status: string, deliverySpeed: string) {
  switch (stageIndex(status)) {
    case 5:
      return "Your order has been delivered.";
    case 4:
      return "Your laundry is on the way.";
    case 3:
      return "Your laundry is being cleaned with care.";
    case 2:
      return "Your laundry has been picked up.";
    case 1:
      return "Your Washlee Pro is on the way to pickup.";
    case 0:
      return "Your Washlee Pro has accepted the order.";
    default:
      return `Your order is queued for ${deliverySpeed === "express" ? "Express" : "Standard"} service.`;
  }
}

function getNextStep(status: string) {
  switch (stageIndex(status)) {
    case 5:
      return "Order complete";
    case 4:
      return "Delivery in progress";
    case 3:
      return "Cleaning in progress";
    case 2:
      return "Cleaning starts next";
    case 1:
      return "Pickup in progress";
    case 0:
      return "Pro will start pickup";
    default:
      return "Waiting for pro assignment";
  }
}

function progressPercent(status: string) {
  switch (stageIndex(status)) {
    case 5:
      return 100;
    case 4:
      return 84;
    case 3:
      return 66;
    case 2:
      return 48;
    case 1:
      return 30;
    case 0:
      return 15;
    default:
      return 8;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  try {
    const { orderId } = await params;
    if (!orderId)
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 },
      );

    await expireStaleAvailableJobs(supabaseAdmin);

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      console.error(
        "[Delivery Status] Order not found:",
        orderId,
        orderError?.message,
      );
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const proId = readString(order, [
      "assigned_pro_id",
      "pro_id",
      "employee_id",
    ]);
    let assignedPro = null;
    const currentStatus = readString(
      order,
      ["stage_status", "status"],
      "pending",
    );
    const shareLiveLocation = canShareLiveLocation(currentStatus);
    const exposeProPhone = process.env.EXPOSE_PRO_PHONE_TO_CUSTOMER === "true";

    if (proId) {
      const { data: pro } = await supabaseAdmin
        .from("employees")
        .select("*")
        .eq("id", proId)
        .maybeSingle();

      if (pro) {
        const currentLatitude =
          readNumber(pro, ["current_latitude"]) ||
          readNumber(order, ["pro_latitude"]);
        const currentLongitude =
          readNumber(pro, ["current_longitude"]) ||
          readNumber(order, ["pro_longitude"]);
        const hasCurrentLocation =
          Number.isFinite(currentLatitude) &&
          Number.isFinite(currentLongitude) &&
          (currentLatitude !== 0 || currentLongitude !== 0);

        assignedPro = {
          id: pro.id,
          firstName: readString(pro, ["first_name", "firstName"]),
          lastName: readString(pro, ["last_name", "lastName"]),
          name: readString(
            pro,
            ["name"],
            `${readString(pro, ["first_name"])} ${readString(pro, ["last_name"])}`.trim(),
          ),
          phone: exposeProPhone ? readString(pro, ["phone"]) : "",
          vehicle: pro.vehicle || null,
          rating: pro.rating || null,
          currentLocation:
            shareLiveLocation && hasCurrentLocation
              ? {
                  latitude: currentLatitude,
                  longitude: currentLongitude,
                  accuracyMeters:
                    readNumber(pro, ["current_location_accuracy_m"]) ||
                    readNumber(order, ["pro_location_accuracy_m"]) ||
                    null,
                  heading:
                    readNumber(pro, ["current_location_heading"]) ||
                    readNumber(order, ["pro_location_heading"]) ||
                    null,
                  updatedAt:
                    pro.current_location_updated_at ||
                    order.pro_location_updated_at ||
                    null,
                }
              : null,
        };
      }
    }

    const deliverySpeed = readString(order, ["delivery_speed"], "standard");
    const estimatedDeliveryDate =
      order.estimated_delivery_date ||
      order.scheduled_delivery_date ||
      order.delivery_date ||
      null;

    return NextResponse.json({
      status: {
        orderId: order.id,
        currentStatus,
        deliverySpeed,
        weightKg: readNumber(order, ["weight_kg", "weight"]),
        deliveryAddress: order.delivery_address || null,
        pickupAddress: order.pickup_address || null,
        createdAt: order.created_at,
        estimatedDeliveryDate,
        progressPercent: progressPercent(currentStatus),
        assignedPro,
        currentLocation: canShareLiveLocation(currentStatus)
          ? assignedPro?.currentLocation || null
          : null,
        statusMessage: getStatusMessage(currentStatus, deliverySpeed),
        nextStep: getNextStep(currentStatus),
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Delivery Status] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
