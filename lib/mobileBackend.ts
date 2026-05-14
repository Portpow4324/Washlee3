import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const mobileCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export function mobileJson(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...mobileCorsHeaders,
      ...init?.headers,
    },
  });
}

export function mobileOptions() {
  return new NextResponse(null, { status: 204, headers: mobileCorsHeaders });
}

export function getMobileClients() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    throw new Error("Supabase environment variables are not configured");
  }

  return {
    auth: createClient(supabaseUrl, anonKey),
    admin: createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
  };
}

export async function getMobileUser(request: NextRequest) {
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!token) return { user: null, error: "Missing authorization token" };

  const { auth } = getMobileClients();
  const { data, error } = await auth.auth.getUser(token);
  if (error || !data.user)
    return { user: null, error: "Invalid or expired token" };

  return { user: data.user, error: null };
}

export async function findLinkedEmployee(
  admin: SupabaseClient,
  user: { id: string; email?: string | null },
) {
  let { data: employee, error } = await admin
    .from("employees")
    .select("id, employee_id, first_name, last_name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (!employee && user.email) {
    const fallback = await admin
      .from("employees")
      .select("id, employee_id, first_name, last_name, email")
      .eq("email", user.email.toLowerCase())
      .maybeSingle();
    employee = fallback.data;
    error = fallback.error;
  }

  return { employee, error };
}

export function readString(
  source: Record<string, unknown> | null | undefined,
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
  source: Record<string, unknown> | null | undefined,
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

export function parseJsonRecord(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "object" && !Array.isArray(raw))
    return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  return {};
}

const proofPhotoBucket = "order-proof-photos";
const proofPhotoSignedUrlSeconds = 60 * 60 * 24;

const stageProofUrlKeys: Record<string, string> = {
  pickup: "arrival_photo_url",
  picked_up: "pickup_photo_url",
  cleaning: "cleaning_photo_url",
  in_transit: "delivery_progress_photo_url",
  delivered: "delivery_photo_url",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

async function signedProofUrl(admin: SupabaseClient, path: string) {
  if (!path) return "";
  const { data, error } = await admin.storage
    .from(proofPhotoBucket)
    .createSignedUrl(path, proofPhotoSignedUrlSeconds);
  if (error) {
    console.warn("[MobileBackend] Proof photo signing failed:", error.message);
    return "";
  }
  return data?.signedUrl || "";
}

export async function withSignedOrderProofPhotos<T extends Record<string, any>>(
  admin: SupabaseClient,
  order: T,
): Promise<T> {
  const proofPhotos = parseJsonRecord(order.proof_photos);
  if (Object.keys(proofPhotos).length === 0) return order;

  const signedProofPhotos: Record<string, unknown> = { ...proofPhotos };

  for (const [stage, rawProof] of Object.entries(proofPhotos)) {
    if (!isRecord(rawProof)) continue;
    const path = readString(rawProof, ["path", "storagePath", "storage_path"]);
    if (!path) continue;

    const signedUrl = await signedProofUrl(admin, path);
    if (!signedUrl) continue;

    signedProofPhotos[stage] = {
      ...rawProof,
      url: signedUrl,
      signedUrl,
    };

    const directUrlKey = stageProofUrlKeys[stage];
    if (directUrlKey) signedProofPhotos[directUrlKey] = signedUrl;
  }

  return {
    ...order,
    proof_photos: signedProofPhotos,
  };
}

export async function withSignedOrderProofPhotosList<
  T extends Record<string, any>,
>(admin: SupabaseClient, orders: T[] | null | undefined): Promise<T[]> {
  return Promise.all(
    (orders || []).map((order) => withSignedOrderProofPhotos(admin, order)),
  );
}

export async function insertNotification(
  admin: SupabaseClient,
  payload: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  },
) {
  const { error } = await admin.from("notifications").insert({
    user_id: payload.userId,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    data: payload.data || {},
    read: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.warn("[MobileBackend] Notification insert failed:", error.message);
  }
}
