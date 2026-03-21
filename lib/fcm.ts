// Firebase Cloud Messaging - Placeholder for MVP
// To be implemented in Phase 9

export async function sendFCMNotification(fcmToken: string, title: string, body: string): Promise<void> {
  console.log('[FCM] Notification would be sent:', { fcmToken: fcmToken.slice(-8), title, body })
  // TODO: Integrate with Supabase and Firebase Cloud Messaging in Phase 9
}

export function getSecondaryAdmin() {
  return null
}
