import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Privacy Policy | Washlee',
  description:
    'Read the Washlee privacy policy for how customer, Pro, order, payment and support data is handled.',
  path: '/privacy-policy',
})

export default function PrivacyPolicyLayout({ children }: { children: ReactNode }) {
  return children
}
