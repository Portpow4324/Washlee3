import { NextRequest, NextResponse } from "next/server";
import { isFcmConfigured, sendFCMNotification } from "@/lib/fcm";
import { getMobileClients, readString } from "@/lib/mobileBackend";

type JsonRecord = Record<string, unknown>;

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value))
    return value
      .map(String)
      .map((item) => item.trim())
      .filter(Boolean);
  const text = String(value || "").trim();
  return text ? [text] : [];
}

function toFcmData(data: JsonRecord | undefined) {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(data || {})) {
    if (value === undefined || value === null) continue;
    result[key] = typeof value === "string" ? value : JSON.stringify(value);
  }
  return result;
}

async function sendLegacyFcm(params: {
  token: string;
  title: string;
  body: string;
  data?: JsonRecord;
}) {
  const serverKey =
    process.env.FCM_LEGACY_SERVER_KEY || process.env.FIREBASE_SERVER_KEY;
  if (!serverKey) return { sent: false, skipped: true };

  const response = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      Authorization: `key=${serverKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: params.token,
      notification: {
        title: params.title,
        body: params.body,
      },
      data: toFcmData(params.data),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || `FCM request failed with ${response.status}`);
  }

  return { sent: true, skipped: false };
}

async function sendPush(params: {
  token: string;
  title: string;
  body: string;
  data?: JsonRecord;
}) {
  if (isFcmConfigured()) {
    return sendFCMNotification(
      params.token,
      params.title,
      params.body,
      params.data,
    );
  }

  const legacy = await sendLegacyFcm(params);
  return {
    ...legacy,
    transport: legacy.sent ? "fcm_legacy" : "not_configured",
  };
}

export async function POST(request: NextRequest) {
  try {
    const configuredKey = process.env.NOTIFICATION_API_KEY;
    if (configuredKey) {
      const requestKey =
        request.headers.get("x-api-key") ||
        request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
      if (requestKey !== configuredKey) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 },
        );
      }
    }

    const body = await request.json();
    const title = readString(body, ["title"]);
    const message = readString(body, ["body", "message"]);
    const type = readString(body, ["type"], "mobile_push");
    const data =
      body.data && typeof body.data === "object" && !Array.isArray(body.data)
        ? (body.data as JsonRecord)
        : {};
    const userIds = [
      ...toStringArray(body.userId || body.user_id),
      ...toStringArray(body.userIds || body.user_ids),
    ];
    const directTokens = [
      ...toStringArray(body.fcmToken || body.token || body.deviceToken),
      ...toStringArray(body.fcmTokens || body.tokens || body.deviceTokens),
    ];

    if (!title || !message) {
      return NextResponse.json(
        { success: false, error: "Title and body are required" },
        { status: 400 },
      );
    }

    if (userIds.length === 0 && directTokens.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Provide at least one userId or device token",
        },
        { status: 400 },
      );
    }

    const { admin } = getMobileClients();
    const uniqueUserIds = Array.from(new Set(userIds));
    const uniqueTokens = new Set(directTokens);
    const now = new Date().toISOString();

    if (uniqueUserIds.length > 0) {
      const rows = uniqueUserIds.map((userId) => ({
        user_id: userId,
        type,
        title,
        message,
        data,
        read: false,
        archived: false,
        created_at: now,
        updated_at: now,
      }));

      const { error: notificationError } = await admin
        .from("notifications")
        .insert(rows);
      if (notificationError) {
        console.warn(
          "[Notifications Send] In-app insert failed:",
          notificationError.message,
        );
      }

      const { data: tokenRows, error: tokenError } = await admin
        .from("device_tokens")
        .select("token")
        .in("user_id", uniqueUserIds)
        .eq("is_active", true);

      if (tokenError) {
        console.warn(
          "[Notifications Send] Device token lookup failed:",
          tokenError.message,
        );
      } else {
        for (const row of tokenRows || []) {
          const token = readString(row as JsonRecord, ["token"]);
          if (token) uniqueTokens.add(token);
        }
      }
    }

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    const transports = new Set<string>();
    for (const token of uniqueTokens) {
      try {
        const result = await sendPush({ token, title, body: message, data });
        if (result.sent) sent += 1;
        if (result.skipped) skipped += 1;
        transports.add(result.transport);
      } catch (error) {
        failed += 1;
        console.warn("[Notifications Send] FCM send failed:", error);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        usersNotified: uniqueUserIds.length,
        deviceTokens: uniqueTokens.size,
        pushSent: sent,
        pushFailed: failed,
        pushSkipped: skipped,
        pushTransport: Array.from(transports).join(",") || "not_configured",
      },
    });
  } catch (error) {
    console.error("[Notifications Send] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send notification" },
      { status: 500 },
    );
  }
}
