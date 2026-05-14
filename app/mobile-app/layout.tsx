import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Washlee App | Book Laundry Pickup from Your Phone',
  description:
    'Use the Washlee mobile app to book laundry pickup, track orders, chat with your Pro, and manage free Wash Club rewards.',
  path: '/mobile-app',
})

export default function MobileAppLayout({ children }: { children: ReactNode }) {
  return children
}
