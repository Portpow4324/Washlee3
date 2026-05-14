import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

type JsonRecord = Record<string, unknown>;

type FcmSendResult = {
  sent: boolean;
  skipped: boolean;
  transport: "fcm_admin" | "not_configured";
};

function toFcmData(data: JsonRecord | undefined) {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(data || {})) {
    if (value === undefined || value === null) continue;
    result[key] = typeof value === "string" ? value : JSON.stringify(value);
  }
  return result;
}

function serviceAccountFromEnv() {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson) as {
        project_id?: string;
        projectId?: string;
        client_email?: string;
        clientEmail?: string;
        private_key?: string;
        privateKey?: string;
      };

      return {
        projectId: parsed.project_id || parsed.projectId,
        clientEmail: parsed.client_email || parsed.clientEmail,
        privateKey: (parsed.private_key || parsed.privateKey)?.replace(
          /\\n/g,
          "\n",
        ),
      };
    } catch (error) {
      console.warn("[FCM] Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON:", error);
    }
  }

  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };
}

export function isFcmConfigured() {
  const serviceAccount = serviceAccountFromEnv();
  return Boolean(
    serviceAccount.projectId &&
    serviceAccount.clientEmail &&
    serviceAccount.privateKey,
  );
}

function getFirebaseAdminApp(): App | null {
  const existing = getApps()[0];
  if (existing) return existing;

  const serviceAccount = serviceAccountFromEnv();
  if (
    !serviceAccount.projectId ||
    !serviceAccount.clientEmail ||
    !serviceAccount.privateKey
  ) {
    return null;
  }

  return initializeApp({
    credential: cert({
      projectId: serviceAccount.projectId,
      clientEmail: serviceAccount.clientEmail,
      privateKey: serviceAccount.privateKey,
    }),
  });
}

export async function sendFCMNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: JsonRecord,
): Promise<FcmSendResult> {
  const app = getFirebaseAdminApp();
  if (!app) return { sent: false, skipped: true, transport: "not_configured" };

  await getMessaging(app).send({
    token: fcmToken,
    notification: { title, body },
    data: toFcmData(data),
    android: {
      priority: "high",
      notification: {
        channelId: "washlee_updates",
        sound: "default",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
        },
      },
    },
  });

  return { sent: true, skipped: false, transport: "fcm_admin" };
}

export function getSecondaryAdmin() {
  return getFirebaseAdminApp();
}
