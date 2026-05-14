import { NextRequest } from "next/server";
import { getMobileUser, mobileJson, mobileOptions } from "@/lib/mobileBackend";

export async function OPTIONS() {
  return mobileOptions();
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ methodId: string }> },
) {
  const { user, error: authError } = await getMobileUser(request);
  if (authError || !user)
    return mobileJson({ success: false, error: authError }, { status: 401 });

  const { methodId } = await params;
  if (!methodId)
    return mobileJson(
      { success: false, error: "Missing payment method id" },
      { status: 400 },
    );

  // Current mobile payments are Stripe Checkout-based; there is no local saved
  // card table to mutate. Keep the legacy endpoint non-breaking.
  return mobileJson({ success: true });
}
