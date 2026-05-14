import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Washlee Referrals',
  description:
    'Washlee referrals are being prepared for launch. This page is not part of the public SEO launch set yet.',
  alternates: {
    canonical: '/referrals',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function ReferralsLayout({ children }: { children: ReactNode }) {
  return children
}
