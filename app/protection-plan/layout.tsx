import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Washlee Protection Plan | Laundry Cover Options',
  description:
    'Compare Washlee basic, Premium and Premium+ protection options for accidental damage or loss during the laundry process.',
  path: '/protection-plan',
})

export default function ProtectionPlanLayout({ children }: { children: ReactNode }) {
  return children
}
