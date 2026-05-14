import { redirect } from 'next/navigation'

export default function LegacySubscriptionDetailsRedirect() {
  redirect('/dashboard/subscriptions')
}
