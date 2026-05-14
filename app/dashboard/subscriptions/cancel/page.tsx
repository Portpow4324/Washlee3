import { redirect } from 'next/navigation'

export default function LegacySubscriptionCancelRedirect() {
  redirect('/dashboard/subscriptions')
}
