import { redirect } from 'next/navigation'

export default function CompleteProfileRedirect() {
  redirect('/auth/email-confirmed')
}
