import { mobileJson, mobileOptions } from "@/lib/mobileBackend";

/**
 * GET /api/subscriptions/plans
 *
 * Washlee no longer sells paid subscription tiers.
 * The service is pay-per-order ($7.50/kg standard, $12.50/kg express, $75 minimum).
 * Wash Club rewards are free to join — see /api/wash-club/* endpoints.
 *
 * The route is preserved as a stable mobile contract so older clients don't crash;
 * it returns an empty `plans` array and a neutral pay-per-order message.
 */
export async function OPTIONS() {
  return mobileOptions();
}

export async function GET() {
  return mobileJson({
    success: true,
    plans: [],
    message:
      "Washlee is pay-per-order. Standard $7.50/kg, Express $12.50/kg, $75 minimum (AUD). Free Wash Club rewards on every order.",
    pricingModel: "pay_per_order",
    currency: "AUD",
    washClub: {
      enrolled: false,
      paidMembership: false,
    },
  });
}
