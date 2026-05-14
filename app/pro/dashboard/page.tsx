import { redirect } from 'next/navigation'

export default function LegacyProDashboardRedirect() {
  redirect('/employee/dashboard')
}
