import { notFound } from 'next/navigation'
import LocalLandingPage from '@/components/marketing/LocalLandingPage'
import { findServiceArea, serviceAreaSuburbs, slugifySuburb, type LocalLandingPageConfig } from '@/lib/localLandingPages'
import { createPageMetadata } from '@/lib/seo'

export function generateStaticParams() {
  return serviceAreaSuburbs.map((suburb) => ({ suburbSlug: slugifySuburb(suburb) }))
}

export const dynamicParams = false

function buildSuburbPage(suburb: string): LocalLandingPageConfig {
  return {
    slug: `service-areas/${slugifySuburb(suburb)}`,
    title: `Laundry pickup in ${suburb}`,
    metaTitle: `Laundry Pickup ${suburb} | Washlee Melbourne`,
    description: `Book Washlee laundry pickup and delivery in ${suburb}. Standard wash & fold is $7.50/kg, Express same-day is $12.50/kg, with a $75 minimum order.`,
    eyebrow: `${suburb} laundry pickup`,
    intro: `Washlee helps ${suburb} customers book laundry pickup, track orders, and get fresh folded laundry delivered back.`,
    audience:
      'Use booking to confirm your exact address, available pickup windows, and whether a Washlee Pro is available within range.',
    highlights: [
      'Melbourne-first pickup and delivery',
      'Standard wash & fold from $7.50/kg',
      'Express same-day from $12.50/kg where available',
      'Free Wash Club rewards on every order',
    ],
    faqs: [
      {
        question: `Does Washlee service ${suburb}?`,
        answer:
          'Washlee is expanding across Greater Melbourne. Enter your address at booking to confirm current coverage and Pro availability before payment.',
      },
      {
        question: 'How much does it cost?',
        answer:
          'Standard wash & fold is $7.50/kg, Express same-day is $12.50/kg, and every order has a $75 minimum in AUD.',
      },
      {
        question: 'Do I need a subscription?',
        answer:
          'No. Washlee is pay-per-order, and Wash Club rewards are free loyalty only.',
      },
    ],
  }
}

export function generateMetadata({ params }: { params: { suburbSlug: string } }) {
  const suburb = findServiceArea(params.suburbSlug)
  if (!suburb) return {}
  const page = buildSuburbPage(suburb)

  return createPageMetadata({
    title: page.metaTitle,
    description: page.description,
    path: `/service-areas/${params.suburbSlug}`,
  })
}

export default function SuburbServiceAreaPage({ params }: { params: { suburbSlug: string } }) {
  const suburb = findServiceArea(params.suburbSlug)
  if (!suburb) notFound()

  return <LocalLandingPage page={buildSuburbPage(suburb)} />
}
