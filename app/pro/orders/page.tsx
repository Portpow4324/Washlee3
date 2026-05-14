import { redirect } from 'next/navigation'

export default function LegacyProOrdersRedirect() {
  redirect('/employee/orders')
}
