import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Business Laundry Melbourne | Washlee',
  description:
    'Recurring laundry pickup and delivery for Melbourne cafes, restaurants, salons, gyms, offices and short-stay operators. Tea towels, aprons, uniforms, towels — quote-based, customer-owned laundry.',
  path: '/business',
})

export default function BusinessLayout({ children }: { children: ReactNode }) {
  return children
}
