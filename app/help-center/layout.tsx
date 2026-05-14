import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Washlee Help Centre | Support for Laundry Orders',
  description:
    'Get help with Washlee bookings, order tracking, pricing, Wash Club rewards, refunds, damage protection and Pro support.',
  path: '/help-center',
})

export default function HelpCenterLayout({ children }: { children: ReactNode }) {
  return children
}
