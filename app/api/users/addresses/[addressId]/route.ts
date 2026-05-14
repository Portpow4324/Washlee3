import { NextRequest } from "next/server";
import {
  getMobileClients,
  getMobileUser,
  mobileJson,
  mobileOptions,
  parseJsonRecord,
  readString,
} from "@/lib/mobileBackend";

export async function OPTIONS() {
  return mobileOptions();
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ addressId: string }> },
) {
  try {
    const { user, error: authError } = await getMobileUser(request);
    if (authError || !user)
      return mobileJson({ success: false, error: authError }, { status: 401 });

    const { addressId } = await params;
    const requestedId = decodeURIComponent(addressId || "").trim();
    const { admin } = getMobileClients();
    const { data, error: fetchError } = await admin
      .from("customers")
      .select("id, delivery_address")
      .eq("id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error(
        "[Mobile Addresses] Delete lookup failed:",
        fetchError.message,
      );
      return mobileJson(
        { success: false, error: "Failed to delete address" },
        { status: 500 },
      );
    }

    if (!data?.delivery_address) return mobileJson({ success: true });

    const currentAddress = parseJsonRecord(data.delivery_address);
    const currentId = readString(currentAddress, ["id"], `primary-${user.id}`);
    if (requestedId && requestedId !== currentId && requestedId !== "primary") {
      return mobileJson(
        { success: false, error: "Address not found" },
        { status: 404 },
      );
    }

    const { error: updateError } = await admin
      .from("customers")
      .update({
        delivery_address: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error(
        "[Mobile Addresses] Delete update failed:",
        updateError.message,
      );
      return mobileJson(
        { success: false, error: "Failed to delete address" },
        { status: 500 },
      );
    }

    return mobileJson({ success: true });
  } catch (error) {
    console.error("[Mobile Addresses] Unexpected delete error:", error);
    return mobileJson(
      { success: false, error: "Failed to delete address" },
      { status: 500 },
    );
  }
}
