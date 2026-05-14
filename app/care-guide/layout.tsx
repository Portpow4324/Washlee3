import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Laundry Care Guide | Washlee Melbourne',
  description:
    'Read Washlee care guidance for cotton, activewear, denim, linen, wool, delicates and items that need special laundry handling.',
  path: '/care-guide',
})

export default function CareGuideLayout({ children }: { children: ReactNode }) {
  return children
}
