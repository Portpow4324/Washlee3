import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Washlee Services | Wash & Fold, Express and Delicates',
  description:
    'Compare Washlee services in Melbourne: standard wash & fold, express same-day laundry, delicates / special care, hang dry and protection add-ons.',
  path: '/services',
})

export default function ServicesLayout({ children }: { children: ReactNode }) {
  return children
}
