import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'How Washlee Works | Laundry Pickup and Delivery Melbourne',
  description:
    'Book a Washlee pickup, choose your wash preferences, track your order, and get fresh folded laundry delivered across Greater Melbourne.',
  path: '/how-it-works',
})

export default function HowItWorksLayout({ children }: { children: ReactNode }) {
  return children
}
