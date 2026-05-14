import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Wash Club Rewards | Free Laundry Loyalty Program',
  description:
    'Join Washlee Wash Club for free and earn loyalty rewards on laundry pickup orders. No paid membership and no subscription fee.',
  path: '/wash-club',
})

export default function WashClubLayout({ children }: { children: ReactNode }) {
  return children
}
