import { redirect } from 'next/navigation'

export default function LegacyAuthAdminLoginRedirect() {
  redirect('/admin-login')
}
