import { redirect } from 'next/navigation'

export default function LegacySubscriptionSuccessRedirect() {
  redirect('/dashboard/subscriptions')
}
