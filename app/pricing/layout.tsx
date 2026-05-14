import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Washlee Pricing | $7.50/kg Laundry Pickup in Melbourne',
  description:
    'See Washlee laundry pickup pricing in Melbourne: $7.50/kg standard wash & fold, $12.50/kg express same-day, and a $75 minimum order.',
  path: '/pricing',
})

export default function PricingLayout({ children }: { children: ReactNode }) {
  return children
}
