import { NextRequest } from "next/server";
import {
  getMobileClients,
  getMobileUser,
  mobileJson,
  mobileOptions,
  parseJsonRecord,
  readNumber,
  readString,
} from "@/lib/mobileBackend";

type AddressRecord = {
  id: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  label: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
};

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
      .from("customers")
      .select("id, delivery_address, state")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[Mobile Addresses] Fetch failed:", error.message);
      return mobileJson(
        { success: false, error: "Failed to fetch addresses" },
        { status: 500 },
      );
    }

    const address = normalizeAddress(
      data?.delivery_address,
      user.id,
      data?.state,
    );
    return mobileJson({
      success: true,
      addresses: address ? [address] : [],
      data: address ? [address] : [],
    });
  } catch (error) {
    console.error("[Mobile Addresses] Unexpected fetch error:", error);
    return mobileJson(
      { success: false, error: "Failed to fetch addresses" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getMobileUser(request);
    if (authError || !user)
      return mobileJson({ success: false, error: authError }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const address = addressFromBody(body, user.id);
    if (
      !address.street ||
      !address.city ||
      !address.state ||
      !address.zip_code
    ) {
      return mobileJson(
        {
          success: false,
          error: "Address, suburb, state, and postcode are required",
        },
        { status: 400 },
      );
    }

    const { admin } = getMobileClients();
    const { data, error } = await admin
      .from("customers")
      .update({
        delivery_address: address,
        state: address.state,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select("id, delivery_address, state")
      .maybeSingle();

    if (error) {
      console.error("[Mobile Addresses] Save failed:", error.message);
      return mobileJson(
        { success: false, error: "Failed to save address" },
        { status: 500 },
      );
    }

    if (!data)
      return mobileJson(
        { success: false, error: "Customer profile not found" },
        { status: 404 },
      );

    const savedAddress =
      normalizeAddress(data.delivery_address, user.id, data.state) || address;
    return mobileJson({
      success: true,
      address: savedAddress,
      data: savedAddress,
    });
  } catch (error) {
    console.error("[Mobile Addresses] Unexpected save error:", error);
    return mobileJson(
      { success: false, error: "Failed to save address" },
      { status: 500 },
    );
  }
}

function addressFromBody(
  body: Record<string, unknown>,
  userId: string,
): AddressRecord {
  return {
    id: readString(body, ["id"], `primary-${userId}`),
    street: readString(body, ["street", "address", "line1", "line_1"]),
    city: readString(body, ["city", "suburb", "locality"]),
    state: readString(body, ["state", "region"]),
    zip_code: readString(body, ["zip_code", "postcode", "postal_code"]),
    country: readString(body, ["country"], "Australia"),
    label: readString(body, ["label"], "Home") || null,
    latitude: nullableNumber(body, ["latitude", "lat"]),
    longitude: nullableNumber(body, ["longitude", "lng", "lon"]),
    is_default: true,
  };
}

function normalizeAddress(
  raw: unknown,
  userId: string,
  fallbackState?: string | null,
): AddressRecord | null {
  if (!raw) return null;
  const value: Record<string, unknown> =
    typeof raw === "string" ? { street: raw } : parseJsonRecord(raw);
  const address = {
    id: readString(value, ["id"], `primary-${userId}`),
    street: readString(value, ["street", "address", "line1", "line_1"]),
    city: readString(value, ["city", "suburb", "locality"]),
    state: readString(value, ["state", "region"], fallbackState || ""),
    zip_code: readString(value, ["zip_code", "postcode", "postal_code"]),
    country: readString(value, ["country"], "Australia"),
    label: readString(value, ["label"], "Home") || null,
    latitude: nullableNumber(value, ["latitude", "lat"]),
    longitude: nullableNumber(value, ["longitude", "lng", "lon"]),
    is_default: value.is_default === false ? false : true,
  };

  if (!address.street && !address.city && !address.zip_code) return null;
  return address;
}

function nullableNumber(source: Record<string, unknown>, keys: string[]) {
  const value = readNumber(source, keys, Number.NaN);
  return Number.isFinite(value) ? value : null;
}
