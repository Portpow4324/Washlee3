import { NextRequest, NextResponse } from "next/server";
import {
  expireStaleAvailableJobs,
  warnJobsNearExpiry,
} from "@/lib/proMatching";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function isAllowed(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const bearer = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  return (
    bearer === secret || request.nextUrl.searchParams.get("secret") === secret
  );
}

export async function GET(request: NextRequest) {
  if (!isAllowed(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  await warnJobsNearExpiry(supabaseAdmin);
  await expireStaleAvailableJobs(supabaseAdmin);

  return NextResponse.json({ success: true });
}
