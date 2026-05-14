import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Washlee Gift Cards | Give Laundry Pickup Credit',
  description:
    'Give Washlee laundry pickup credit by email for Melbourne customers. Gift card checkout is handled by the Washlee team while self-serve checkout is in beta.',
  path: '/gift-cards',
})

export default function GiftCardsLayout({ children }: { children: ReactNode }) {
  return children
}
