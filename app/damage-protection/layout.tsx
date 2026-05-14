import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Damage Protection | Washlee Laundry Care Guarantee',
  description:
    'See what Washlee damage protection covers, how to report an issue, and how basic, Premium and Premium+ order protection work.',
  path: '/damage-protection',
})

export default function DamageProtectionLayout({ children }: { children: ReactNode }) {
  return children
}
