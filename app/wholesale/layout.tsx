import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Wholesale Laundry Pickup Melbourne | Washlee',
  description:
    'Talk to Washlee about wholesale and recurring business laundry pickup options for Melbourne teams and operators.',
  path: '/wholesale',
})

export default function WholesaleLayout({ children }: { children: ReactNode }) {
  return children
}
