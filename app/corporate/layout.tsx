import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Business Laundry Service Melbourne | Washlee',
  description:
    'Washlee helps Melbourne offices, studios, clinics and teams arrange business laundry pickup with standard, express and special-care options.',
  path: '/corporate',
})

export default function CorporateLayout({ children }: { children: ReactNode }) {
  return children
}
