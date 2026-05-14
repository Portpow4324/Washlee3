import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Terms of Service | Washlee',
  description:
    'Read the Washlee terms of service for laundry pickup, delivery, Pro marketplace responsibilities, payments, cancellations and support.',
  path: '/terms-of-service',
})

export default function TermsOfServiceLayout({ children }: { children: ReactNode }) {
  return children
}
