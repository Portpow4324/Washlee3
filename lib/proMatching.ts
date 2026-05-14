import { SupabaseClient } from "@supabase/supabase-js";

export const JOB_ACCEPTANCE_WINDOW_MINUTES = 10;

const ACTIVE_EMPLOYEE_STATUSES = new Set(["available", "active", "online"]);

export type JsonRecord = Record<string, any>;

export type LocationInput = {
  postcode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type AvailabilityRow = {
  employee_id: string;
  availability_schedule?: Record<
    string,
    { available?: boolean; start?: string | null; end?: string | null }
  > | null;
  service_radius_km?: number | null;
  day_of_week?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  is_available?: boolean | null;
};

export type ProMatch = {
  employee: JsonRecord;
  availabilityRows: AvailabilityRow[];
  distanceKm: number | null;
  radiusKm: number;
};

type ServiceArea = string | number | JsonRecord;

export function readString(
  source: JsonRecord | null | undefined,
  keys: string[],
  fallback = "",
) {
  if (!source) return fallback;
  for (const key of keys) {
    const value = source[key];
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return fallback;
}

export function readNumber(
  source: JsonRecord | null | undefined,
  keys: string[],
  fallback = 0,
) {
  if (!source) return fallback;
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

export function parseRecord(raw: unknown): JsonRecord {
  if (!raw) return {};
  if (typeof raw === "object" && !Array.isArray(raw)) return raw as JsonRecord;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as JsonRecord)
        : {};
    } catch {
      return {};
    }
  }
  return {};
}

export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
) {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function extractLocation(
  address: string,
  details?: JsonRecord | null,
): LocationInput {
  const zipMatch = address.match(/\b(\d{4})\b/);
  const parsedDetails = parseRecord(details);
  const latitude = readNumber(parsedDetails, ["latitude", "lat"], Number.NaN);
  const longitude = readNumber(
    parsedDetails,
    ["longitude", "lng", "lon"],
    Number.NaN,
  );

  return {
    postcode:
      readString(parsedDetails, [
        "postcode",
        "postalCode",
        "postal_code",
        "zip",
      ]) || (zipMatch ? zipMatch[1] : null),
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
  };
}

function parseServiceAreas(raw: unknown): ServiceArea[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as ServiceArea[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? (parsed as ServiceArea[])
        : [parsed as ServiceArea];
    } catch {
      return raw
        .split(",")
        .map((area) => area.trim())
        .filter(Boolean);
    }
  }
  if (typeof raw === "number" || typeof raw === "object") {
    return [raw as ServiceArea];
  }
  return [];
}

function getDayKey(date?: string | null) {
  if (!date) return null;
  const dayIndex = new Date(`${date}T00:00:00`).getDay();
  if (Number.isNaN(dayIndex)) return null;
  return [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ][dayIndex];
}

function toMinutes(time?: string | null) {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function rangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
) {
  const aStart = toMinutes(startA);
  const aEnd = toMinutes(endA);
  const bStart = toMinutes(startB);
  const bEnd = toMinutes(endB);

  if (aStart === null || aEnd === null || bStart === null || bEnd === null) {
    return false;
  }
  return aStart < bEnd && bStart < aEnd;
}

function parseTimeSlot(timeSlot?: string | null) {
  if (!timeSlot) return null;
  const match = timeSlot.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (!match) return null;
  return { start: match[1], end: match[2] };
}

function employeeRadiusKm(employee: JsonRecord, rows: AvailabilityRow[]) {
  const rowRadius = Number(
    rows.find((row) => Number(row.service_radius_km))?.service_radius_km,
  );
  const employeeRadius = readNumber(employee, ["service_radius_km"], 15);
  return Number.isFinite(rowRadius) && rowRadius > 0
    ? rowRadius
    : Math.max(employeeRadius || 15, 1);
}

function employeeUserId(employee: JsonRecord) {
  return readString(employee, ["user_id", "id"]);
}

function isEmployeeActive(employee: JsonRecord) {
  const userId = employeeUserId(employee);
  if (!userId) return false;

  const accountStatus = readString(employee, [
    "account_status",
    "status",
  ]).toLowerCase();
  const availabilityStatus = readString(employee, [
    "availability_status",
  ]).toLowerCase();
  const approvalStatus = readString(employee, [
    "approval_status",
    "application_status",
    "verification_status",
  ]).toLowerCase();

  if (
    ["rejected", "suspended", "disabled", "inactive"].includes(accountStatus)
  ) {
    return false;
  }
  if (!ACTIVE_EMPLOYEE_STATUSES.has(availabilityStatus || "available")) {
    return false;
  }
  if (employee.approved === false || employee.is_approved === false) {
    return false;
  }
  if (
    approvalStatus &&
    !["approved", "verified", "active"].includes(approvalStatus)
  ) {
    return false;
  }

  return true;
}

function areaMatchDistance(
  area: ServiceArea,
  location: LocationInput,
  fallbackRadiusKm: number,
) {
  if (!area) return { matches: false, distanceKm: null as number | null };

  if (typeof area === "string" || typeof area === "number") {
    const matches = Boolean(
      location.postcode && String(area).includes(location.postcode),
    );
    return { matches, distanceKm: null };
  }

  const areaPostcode =
    area.postcode || area.zip || area.postalCode || area.postal_code;
  if (
    areaPostcode &&
    location.postcode &&
    String(areaPostcode) === String(location.postcode)
  ) {
    return { matches: true, distanceKm: null };
  }

  const areaLat = Number(area.latitude ?? area.lat);
  const areaLng = Number(area.longitude ?? area.lng);
  const radiusKm = Number(
    area.radiusKm ??
      area.radius_km ??
      area.service_radius_km ??
      fallbackRadiusKm,
  );

  if (
    Number.isFinite(areaLat) &&
    Number.isFinite(areaLng) &&
    Number.isFinite(radiusKm) &&
    typeof location.latitude === "number" &&
    typeof location.longitude === "number"
  ) {
    const distanceKm = calculateDistanceKm(
      areaLat,
      areaLng,
      location.latitude,
      location.longitude,
    );
    return { matches: distanceKm <= radiusKm, distanceKm };
  }

  return { matches: false, distanceKm: null };
}

function isWithinServiceArea(
  employee: JsonRecord,
  rows: AvailabilityRow[],
  location: LocationInput,
) {
  const radiusKm = employeeRadiusKm(employee, rows);
  const serviceAreas = parseServiceAreas(employee.service_areas);
  let nearestDistance: number | null = null;

  if (serviceAreas.length > 0) {
    for (const area of serviceAreas) {
      const match = areaMatchDistance(area, location, radiusKm);
      if (typeof match.distanceKm === "number") {
        nearestDistance =
          nearestDistance === null
            ? match.distanceKm
            : Math.min(nearestDistance, match.distanceKm);
      }
      if (match.matches) return { matches: true, distanceKm: nearestDistance };
    }
    return { matches: false, distanceKm: nearestDistance };
  }

  const employeeLat = readNumber(
    employee,
    ["latitude", "lat", "current_latitude"],
    Number.NaN,
  );
  const employeeLng = readNumber(
    employee,
    ["longitude", "lng", "current_longitude"],
    Number.NaN,
  );

  if (
    Number.isFinite(employeeLat) &&
    Number.isFinite(employeeLng) &&
    typeof location.latitude === "number" &&
    typeof location.longitude === "number"
  ) {
    const distanceKm = calculateDistanceKm(
      employeeLat,
      employeeLng,
      location.latitude,
      location.longitude,
    );
    return { matches: distanceKm <= radiusKm, distanceKm };
  }

  return { matches: true, distanceKm: null };
}

function hasScheduleForSlot(
  rows: AvailabilityRow[],
  date?: string | null,
  timeSlot?: string | null,
) {
  const dayKey = getDayKey(date);
  const slot = parseTimeSlot(timeSlot);
  if (!dayKey || !slot || rows.length === 0) return true;

  const scheduleRows = rows.filter((row) => row.availability_schedule);
  for (const row of scheduleRows) {
    const day = row.availability_schedule?.[dayKey];
    if (!day?.available) continue;
    if (
      day.start &&
      day.end &&
      rangesOverlap(day.start, day.end, slot.start, slot.end)
    ) {
      return true;
    }
  }

  const perDayRows = rows.filter(
    (row) => String(row.day_of_week || "").toLowerCase() === dayKey,
  );
  for (const row of perDayRows) {
    if (row.is_available === false) continue;
    if (
      row.start_time &&
      row.end_time &&
      rangesOverlap(row.start_time, row.end_time, slot.start, slot.end)
    ) {
      return true;
    }
  }

  return false;
}

export function matchEmployeeToJob({
  employee,
  availabilityRows,
  pickupAddress,
  pickupAddressDetails,
  pickupDate,
  pickupTimeSlot,
}: {
  employee: JsonRecord;
  availabilityRows: AvailabilityRow[];
  pickupAddress?: string | null;
  pickupAddressDetails?: JsonRecord | null;
  pickupDate?: string | null;
  pickupTimeSlot?: string | null;
}) {
  const location = extractLocation(pickupAddress || "", pickupAddressDetails);
  const radiusKm = employeeRadiusKm(employee, availabilityRows);

  if (!isEmployeeActive(employee)) {
    return { eligible: false, reason: "inactive", distanceKm: null, radiusKm };
  }

  const serviceArea = isWithinServiceArea(employee, availabilityRows, location);
  if (!serviceArea.matches) {
    return {
      eligible: false,
      reason: "out_of_radius",
      distanceKm: serviceArea.distanceKm,
      radiusKm,
    };
  }

  if (!hasScheduleForSlot(availabilityRows, pickupDate, pickupTimeSlot)) {
    return {
      eligible: false,
      reason: "unavailable",
      distanceKm: serviceArea.distanceKm,
      radiusKm,
    };
  }

  return {
    eligible: true,
    reason: "eligible",
    distanceKm: serviceArea.distanceKm,
    radiusKm,
  };
}

export async function loadAvailabilityByEmployee(
  supabase: SupabaseClient,
  employeeIds?: string[],
) {
  let query = supabase.from("employee_availability").select("*");
  if (employeeIds?.length) query = query.in("employee_id", employeeIds);

  const { data, error } = await query;
  if (error) {
    console.warn("[ProMatching] Could not load availability:", error.message);
  }

  const rowsByEmployee = new Map<string, AvailabilityRow[]>();
  for (const row of (data || []) as AvailabilityRow[]) {
    const rows = rowsByEmployee.get(row.employee_id) || [];
    rows.push(row);
    rowsByEmployee.set(row.employee_id, rows);
  }
  return rowsByEmployee;
}

export async function loadEligibleProsForJob(
  supabase: SupabaseClient,
  params: {
    pickupAddress?: string | null;
    pickupAddressDetails?: JsonRecord | null;
    pickupDate?: string | null;
    pickupTimeSlot?: string | null;
    limit?: number;
  },
): Promise<ProMatch[]> {
  const { data: employees, error } = await supabase
    .from("employees")
    .select("*")
    .limit(params.limit || 100);

  if (error) {
    console.warn("[ProMatching] Could not load employees:", error.message);
    return [];
  }

  const availabilityByEmployee = await loadAvailabilityByEmployee(supabase);
  const matches: ProMatch[] = [];

  for (const employee of (employees || []) as JsonRecord[]) {
    const availabilityRows = availabilityByEmployee.get(employee.id) || [];
    const match = matchEmployeeToJob({
      employee,
      availabilityRows,
      pickupAddress: params.pickupAddress,
      pickupAddressDetails: params.pickupAddressDetails,
      pickupDate: params.pickupDate,
      pickupTimeSlot: params.pickupTimeSlot,
    });

    if (match.eligible) {
      matches.push({
        employee,
        availabilityRows,
        distanceKm: match.distanceKm,
        radiusKm: match.radiusKm,
      });
    }
  }

  return matches;
}

export async function expireStaleAvailableJobs(supabase: SupabaseClient) {
  const now = new Date().toISOString();
  const { data: jobs, error } = await supabase
    .from("pro_jobs")
    .select("id,order_id,expires_at")
    .eq("status", "available")
    .lt("expires_at", now)
    .limit(100);

  if (error) {
    if (!String(error.message || "").includes("expires_at")) {
      console.warn("[ProMatching] Could not load stale jobs:", error.message);
    }
    return;
  }

  for (const job of jobs || []) {
    const expiredAt = new Date().toISOString();
    let update = await supabase
      .from("pro_jobs")
      .update({
        status: "expired",
        expired_at: expiredAt,
        updated_at: expiredAt,
      })
      .eq("id", job.id)
      .eq("status", "available");

    if (update.error) {
      update = await supabase
        .from("pro_jobs")
        .update({
          status: "cancelled",
          updated_at: expiredAt,
        })
        .eq("id", job.id)
        .eq("status", "available");
    }

    if (update.error) {
      console.warn("[ProMatching] Could not expire job:", update.error.message);
      continue;
    }

    const { data: order } = await supabase
      .from("orders")
      .select("id,user_id")
      .eq("id", job.order_id)
      .maybeSingle();

    await supabase
      .from("orders")
      .update({
        status: "cancelled",
        stage_status: "cancelled",
        cancellation_reason:
          "No Washlee Pro accepted this order within 10 minutes.",
        updated_at: expiredAt,
      })
      .eq("id", job.order_id)
      .in("status", ["confirmed", "pending"]);

    if (order?.user_id) {
      await supabase.from("notifications").insert({
        user_id: order.user_id,
        type: "order_unmatched",
        title: "We could not match a Pro",
        message:
          "No Washlee Pro accepted your order within 10 minutes. Please try another pickup time or contact support.",
        data: {
          orderId: order.id,
          route: `/orders/${order.id}/tracking`,
          notificationType: "order_unmatched",
        },
        read: false,
        created_at: expiredAt,
        updated_at: expiredAt,
      });
    }
  }
}

export async function warnJobsNearExpiry(supabase: SupabaseClient) {
  const now = Date.now();
  const soon = new Date(now + 2 * 60 * 1000).toISOString();
  const { data: jobs, error } = await supabase
    .from("pro_jobs")
    .select("id,order_id,expires_at,candidate_pro_ids,warning_sent_at")
    .eq("status", "available")
    .is("warning_sent_at", null)
    .gt("expires_at", new Date(now).toISOString())
    .lte("expires_at", soon)
    .limit(100);

  if (error) {
    if (!String(error.message || "").includes("warning_sent_at")) {
      console.warn(
        "[ProMatching] Could not load expiring jobs:",
        error.message,
      );
    }
    return;
  }

  for (const job of jobs || []) {
    const candidateIds = Array.isArray(job.candidate_pro_ids)
      ? job.candidate_pro_ids.map(String).filter(Boolean)
      : [];
    if (candidateIds.length === 0) continue;

    const { data: employees } = await supabase
      .from("employees")
      .select("*")
      .in("id", candidateIds);
    const notificationUserIds = (employees || [])
      .map((employee) => readString(employee as JsonRecord, ["user_id", "id"]))
      .filter(Boolean);
    if (notificationUserIds.length === 0) continue;

    const createdAt = new Date().toISOString();
    await supabase.from("notifications").insert(
      notificationUserIds.map((userId) => ({
        user_id: userId,
        type: "available_job_expiring",
        title: "Pickup closes soon",
        message:
          "This job will close if no Pro accepts it in the next couple of minutes.",
        data: {
          orderId: job.order_id,
          jobId: job.id,
          expiresAt: job.expires_at,
          route: "/pro/jobs",
          notificationType: "available_job_expiring",
        },
        read: false,
        created_at: createdAt,
        updated_at: createdAt,
      })),
    );

    await supabase
      .from("pro_jobs")
      .update({ warning_sent_at: createdAt, updated_at: createdAt })
      .eq("id", job.id)
      .is("warning_sent_at", null);
  }
}
