import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'About Washlee | Melbourne Laundry Pickup and Delivery',
  description:
    'Learn about Washlee, a Melbourne-first laundry pickup and delivery service built around trust, convenience and careful garment handling.',
  path: '/about',
})

export default function AboutLayout({ children }: { children: ReactNode }) {
  return children
}
