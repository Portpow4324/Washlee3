import { redirect } from 'next/navigation'

export default function SecretAdminRedirect() {
  redirect('/admin-login')
}
