import { NextRequest } from "next/server";
import {
  getMobileClients,
  getMobileUser,
  mobileJson,
  mobileOptions,
  readString,
} from "@/lib/mobileBackend";
import { sendPasswordChangedEmail } from "@/lib/emailMarketing";

export async function OPTIONS() {
  return mobileOptions();
}

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getMobileUser(request);
    if (authError || !user) {
      return mobileJson({ success: false, error: authError }, { status: 401 });
    }

    const { admin } = getMobileClients();
    const { data: profile } = await admin
      .from("users")
      .select("email,name,first_name,last_name")
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

    let emailSent = false;
    if (email) {
      try {
        emailSent = await sendPasswordChangedEmail({
          to: email,
          customerName: name,
          changedAt: new Date().toLocaleString("en-AU", {
            timeZone: "Australia/Melbourne",
          }),
        });
      } catch (error) {
        console.warn("[Mobile Password Changed] Email failed:", error);
      }
    }

    return mobileJson({ success: true, emailSent });
  } catch (error) {
    console.error("[Mobile Password Changed] Unexpected error:", error);
    return mobileJson({ success: true, emailSent: false });
  }
}
