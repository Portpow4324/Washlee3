import { redirect } from 'next/navigation'

export default function LegacyProSettingsRedirect() {
  redirect('/employee/settings')
}
