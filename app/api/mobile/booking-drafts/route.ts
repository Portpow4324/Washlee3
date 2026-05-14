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
import { sendAbandonedBookingEmail } from "@/lib/emailMarketing";

function canSendDraftReminder(preferences: Record<string, unknown>) {
  const value = preferences.marketingEmails ?? preferences.marketing_emails;
  return value !== false;
}

export async function OPTIONS() {
  return mobileOptions();
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getMobileUser(request);
    if (authError || !user) {
      return mobileJson({ success: false, error: authError }, { status: 401 });
    }

    const body = await request.json();
    const status = readString(body, ["status"], "saved").toLowerCase();
    const bookingData = parseJsonRecord(body.bookingData || body.booking_data);
    const { admin } = getMobileClients();
    const now = new Date().toISOString();

    const { data: existing } = await admin
      .from("booking_drafts")
      .select("id,last_reminder_sent_at")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: profile } = await admin
      .from("users")
      .select("email,name,first_name,last_name")
      .eq("id", user.id)
      .maybeSingle();

    const { data: customer } = await admin
      .from("customers")
      .select("preferences")
      .eq("id", user.id)
      .maybeSingle();

    const email = readString(profile, ["email"], user.email || "");
    const name =
      readString(profile, ["name"]) ||
      [readString(profile, ["first_name"]), readString(profile, ["last_name"])]
        .filter(Boolean)
        .join(" ") ||
      email.split("@")[0] ||
      "there";
    const preferences = parseJsonRecord(customer?.preferences);

    const shouldEmail = Boolean(
      status === "saved" &&
      email &&
      canSendDraftReminder(preferences) &&
      (!existing?.last_reminder_sent_at ||
        Date.now() - Date.parse(existing.last_reminder_sent_at) >
          24 * 60 * 60 * 1000),
    );

    const { data: draft, error } = await admin
      .from("booking_drafts")
      .upsert(
        {
          user_id: user.id,
          email,
          status,
          booking_data: bookingData,
          updated_at: now,
          last_reminder_sent_at: shouldEmail
            ? now
            : existing?.last_reminder_sent_at || null,
        },
        { onConflict: "user_id" },
      )
      .select()
      .single();

    if (error) {
      console.error("[Mobile Booking Drafts] Upsert failed:", error.message);
      return mobileJson(
        { success: false, error: "Failed to save booking draft" },
        { status: 500 },
      );
    }

    let emailSent = false;
    if (shouldEmail) {
      try {
        const estimatedTotal = readNumber(bookingData, ["total"], 0);
        emailSent = await sendAbandonedBookingEmail({
          to: email,
          customerName: name,
          resumeUrl: `${process.env.NEXT_PUBLIC_APP_URL || "https://washlee.com"}/booking`,
          estimatedTotal: estimatedTotal > 0 ? estimatedTotal : undefined,
          pickupAddress: readString(bookingData, [
            "pickupAddress",
            "pickup_address",
          ]),
        });
      } catch (emailError) {
        console.warn(
          "[Mobile Booking Drafts] Reminder email failed:",
          emailError,
        );
      }
    }

    return mobileJson({ success: true, data: draft, emailSent });
  } catch (error) {
    console.error("[Mobile Booking Drafts] Unexpected error:", error);
    return mobileJson(
      { success: false, error: "Failed to save booking draft" },
      { status: 500 },
    );
  }
}
