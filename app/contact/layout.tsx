import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Contact Washlee | Melbourne Laundry Support',
  description:
    'Contact Washlee for booking help, order support, Pro questions, billing support or business laundry enquiries in Melbourne.',
  path: '/contact',
})

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children
}
