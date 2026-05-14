import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Cookie Policy | Washlee',
  description:
    'Read how Washlee uses essential, analytics and marketing cookies across the website.',
  path: '/cookie-policy',
})

export default function CookiePolicyLayout({ children }: { children: ReactNode }) {
  return children
}
