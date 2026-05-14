import { NextRequest } from "next/server";
import { getMobileUser, mobileJson, mobileOptions } from "@/lib/mobileBackend";

export async function OPTIONS() {
  return mobileOptions();
}

export async function GET(request: NextRequest) {
  const { user, error: authError } = await getMobileUser(request);
  if (authError || !user)
    return mobileJson({ success: false, error: authError }, { status: 401 });

  return mobileJson({
    success: true,
    payment_methods: [],
    data: [],
  });
}

export async function POST(request: NextRequest) {
  const { user, error: authError } = await getMobileUser(request);
  if (authError || !user)
    return mobileJson({ success: false, error: authError }, { status: 401 });

  return mobileJson(
    {
      success: false,
      error:
        "Saved cards are managed through Stripe checkout. Add a card during checkout.",
    },
    { status: 501 },
  );
}
