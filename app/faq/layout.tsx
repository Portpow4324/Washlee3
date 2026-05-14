import type { ReactNode } from 'react'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Washlee FAQ | Laundry Pickup Questions Answered',
  description:
    'Answers to common Washlee questions about pricing, pickup, delivery, express same-day laundry, Wash Club and damage protection.',
  path: '/faq',
})

export default function FaqLayout({ children }: { children: ReactNode }) {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How is Washlee pricing calculated?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Washlee charges per kilogram. Standard wash and fold is $7.50/kg, Express same-day is $12.50/kg, and every order has a $75 minimum in AUD.',
        },
      },
      {
        '@type': 'Question',
        name: 'Where does Washlee operate?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Washlee currently services Greater Melbourne. Customers can enter their suburb during booking to confirm coverage.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is Wash Club a paid subscription?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Wash Club is a free loyalty and rewards program. Washlee is pay-per-order and does not require a paid membership.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I add extra damage protection?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Every order includes basic protection, and customers can add Premium or Premium+ protection at checkout for higher cover limits.',
        },
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  )
}
