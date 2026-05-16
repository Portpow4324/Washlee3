export type LocalLandingFaq = {
  question: string
  answer: string
}

export type LocalLandingPageConfig = {
  slug: string
  title: string
  metaTitle: string
  description: string
  eyebrow: string
  intro: string
  audience: string
  highlights: string[]
  faqs: LocalLandingFaq[]
  /** Optional override for the hero primary CTA. Defaults to the booking flow. */
  primaryCta?: { href: string; label: string }
}

const standardFaqs: LocalLandingFaq[] = [
  {
    question: 'How much does Washlee cost?',
    answer:
      'Standard wash & fold is $7.50/kg, Express same-day is $12.50/kg, and every order has a $75 minimum in AUD.',
  },
  {
    question: 'Is pickup and delivery included?',
    answer:
      'Yes. Pickup and delivery are included inside the Melbourne service area.',
  },
  {
    question: 'Do I need a subscription?',
    answer:
      'No. Washlee is pay-per-order. Wash Club rewards are free loyalty only.',
  },
]

export const cityLandingPages: LocalLandingPageConfig[] = [
  {
    slug: 'laundry-pickup-melbourne',
    title: 'Laundry pickup in Melbourne',
    metaTitle: 'Laundry Pickup Melbourne | Washlee',
    description:
      'Book laundry pickup and delivery in Melbourne with Washlee. Standard wash & fold is $7.50/kg, Express same-day is $12.50/kg, with a $75 minimum order.',
    eyebrow: 'Melbourne laundry pickup',
    intro:
      'Washlee picks up your laundry, handles the wash and fold, and brings it back fresh so your week keeps moving.',
    audience: 'Built for Melbourne homes, renters, busy professionals, families, students, and anyone who wants laundry off the list.',
    highlights: [
      'Book pickup from the website or app',
      'Standard wash & fold from $7.50/kg',
      'Express same-day from $12.50/kg where available',
      'Free Wash Club rewards on every order',
    ],
    faqs: standardFaqs,
  },
  {
    slug: 'wash-and-fold-melbourne',
    title: 'Wash and fold laundry in Melbourne',
    metaTitle: 'Wash and Fold Melbourne | Washlee',
    description:
      'Washlee offers Melbourne wash and fold laundry pickup with clear per-kilo pricing, careful handling, and delivery back to your door.',
    eyebrow: 'Wash and fold',
    intro:
      'Send your everyday laundry and get it back washed, dried, folded, and ready to put away.',
    audience: 'Best for weekly household loads, work clothes, towels, activewear, and everyday essentials.',
    highlights: [
      'Sorted, washed, dried, and folded',
      'Care notes captured at booking',
      'Hang dry available as an add-on',
      'Damage protection included on every order',
    ],
    faqs: standardFaqs,
  },
  {
    slug: 'laundry-delivery-melbourne',
    title: 'Laundry delivery in Melbourne',
    metaTitle: 'Laundry Delivery Melbourne | Washlee',
    description:
      'Get laundry picked up and delivered across Greater Melbourne. Washlee includes pickup and delivery in the per-kilo price.',
    eyebrow: 'Pickup and delivery included',
    intro:
      'Choose a pickup window, add care notes, and track your order from collection through delivery.',
    audience: 'Useful for customers who want a door-to-door laundry service without calling around or carrying bags.',
    highlights: [
      'Pickup and delivery included in service area',
      'Order tracking from your account',
      'Customer support if anything changes',
      'Final price based on actual weight',
    ],
    faqs: standardFaqs,
  },
  {
    slug: 'student-laundry-melbourne',
    title: 'Student laundry service in Melbourne',
    metaTitle: 'Student Laundry Service Melbourne | Washlee',
    description:
      'A simple Melbourne laundry pickup option for students. Pay per order, earn free Wash Club rewards, and avoid laundromat runs.',
    eyebrow: 'Student laundry',
    intro:
      'Book laundry pickup around classes, shifts, and shared-house life without committing to a subscription.',
    audience: 'Designed for students in apartments, shared houses, and dorm-style living where laundry time disappears fast.',
    highlights: [
      'No subscription or membership fee',
      'Medium and large load guidance at booking',
      'Express same-day when timing matters',
      'Free loyalty rewards through Wash Club',
    ],
    faqs: standardFaqs,
  },
  {
    slug: 'business-laundry-melbourne',
    title: 'Business laundry service in Melbourne',
    metaTitle: 'Business Laundry Service Melbourne | Washlee',
    description:
      'Washlee Business Laundry: recurring pickup and delivery for Melbourne cafes, salons, gyms, offices and short-stay operators — tea towels, aprons, uniforms and towels.',
    eyebrow: 'Business laundry',
    intro:
      'For Melbourne teams and venues, Washlee Business Laundry sets up recurring pickup for tea towels, aprons, uniforms, and towels — washed on a schedule and returned ready to use.',
    audience: 'Useful for cafes, restaurants, bakeries, salons, gyms, offices, short-stay operators, and local teams with repeat laundry needs.',
    highlights: [
      'Recurring pickup — weekly through to daily high volume',
      'Quote-based business pricing, scoped to your volume',
      'Service-area check before you commit',
      'Customer-owned laundry, Melbourne-first service area',
    ],
    primaryCta: { href: '/business', label: 'Explore Business Laundry' },
    faqs: [
      ...standardFaqs,
      {
        question: 'How do businesses get started?',
        answer:
          'Use the Business Laundry page to check your area, then request a quote. Business pricing is quote-based and scoped to your item types, volume, and pickup frequency.',
      },
    ],
  },
  {
    slug: 'same-day-laundry-melbourne',
    title: 'Same-day laundry in Melbourne',
    metaTitle: 'Same-Day Laundry Melbourne | Washlee Express',
    description:
      'Need laundry back fast? Washlee Express same-day laundry is $12.50/kg in Melbourne, subject to availability, with a $75 minimum order.',
    eyebrow: 'Express same-day',
    intro:
      'When timing matters, choose Express same-day at booking and we’ll show availability for your address and order size.',
    audience: 'Made for uniforms, travel, last-minute plans, workwear, activewear, and busy weeks.',
    highlights: [
      'Express same-day rate: $12.50/kg',
      'Subject to Pro and service-area availability',
      'Best for medium loads and urgent essentials',
      'Clear status updates after booking',
    ],
    faqs: [
      ...standardFaqs,
      {
        question: 'Is Express always available?',
        answer:
          'Express depends on service-area capacity, order size, and available pickup windows. The booking flow will show what is possible.',
      },
    ],
  },
]

export const serviceAreaSuburbs = [
  'Melbourne CBD',
  'South Melbourne',
  'Richmond',
  'South Yarra',
  'St Kilda',
  'Carlton',
  'Brunswick',
  'Fitzroy',
  'Prahran',
  'Docklands',
]

export function slugifySuburb(suburb: string) {
  return suburb.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function findCityLandingPage(slug: string) {
  return cityLandingPages.find((page) => page.slug === slug)
}

export function findServiceArea(slug: string) {
  return serviceAreaSuburbs.find((suburb) => slugifySuburb(suburb) === slug)
}
