import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { ArrowRight, CheckCircle, MapPin, Sparkles } from 'lucide-react'
import type { LocalLandingPageConfig } from '@/lib/localLandingPages'
import PlaceholderReviews from '@/components/marketing/PlaceholderReviews'

export default function LocalLandingPage({ page }: { page: LocalLandingPageConfig }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: page.title,
    areaServed: {
      '@type': 'City',
      name: 'Melbourne',
      addressCountry: 'AU',
    },
    provider: {
      '@type': 'LocalBusiness',
      name: 'Washlee',
    },
    offers: [
      {
        '@type': 'Offer',
        name: 'Standard wash & fold',
        price: '7.50',
        priceCurrency: 'AUD',
        unitText: 'kg',
      },
      {
        '@type': 'Offer',
        name: 'Express same-day',
        price: '12.50',
        priceCurrency: 'AUD',
        unitText: 'kg',
      },
    ],
    mainEntity: page.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      <section className="bg-soft-hero">
        <div className="container-page py-14 sm:py-24">
          <div className="max-w-3xl">
            <span className="pill mb-4">
              <MapPin size={14} /> {page.eyebrow}
            </span>
            <h1 className="h1 text-dark text-balance mb-4">{page.title}</h1>
            <p className="text-lg text-gray leading-relaxed mb-8">{page.intro}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/booking?landing_page=${page.slug}`}
                data-analytics-label={`${page.slug}_book`}
                className="btn-primary"
              >
                Book a pickup
                <ArrowRight size={16} />
              </Link>
              <Link href="/pricing" className="btn-outline">
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <h2 className="section-title mb-4">Clear Melbourne laundry pickup</h2>
            <p className="text-gray leading-relaxed mb-6">{page.audience}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {page.highlights.map((highlight) => (
                <div key={highlight} className="surface-card p-4 flex gap-3">
                  <CheckCircle size={18} className="text-primary-deep flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-dark">{highlight}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="surface-card p-6 bg-gradient-to-br from-mint to-white">
              <span className="pill mb-4">
                <Sparkles size={14} /> Pricing
              </span>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl bg-white/80 border border-line p-4">
                  <div>
                    <p className="font-bold text-dark">Standard wash &amp; fold</p>
                    <p className="text-xs text-gray">Next business day</p>
                  </div>
                  <p className="text-2xl font-bold text-primary-deep">$7.50<span className="text-sm text-gray">/kg</span></p>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/80 border border-line p-4">
                  <div>
                    <p className="font-bold text-dark">Express same-day</p>
                    <p className="text-xs text-gray">Subject to availability</p>
                  </div>
                  <p className="text-2xl font-bold text-primary-deep">$12.50<span className="text-sm text-gray">/kg</span></p>
                </div>
              </div>
              <p className="text-xs text-gray mt-4">$75 minimum order. Pickup and delivery included inside the Melbourne service area.</p>
            </div>
          </div>
        </div>
      </section>

      <PlaceholderReviews context="local" className="bg-white" />

      <section className="bg-soft-mint">
        <div className="container-page py-14">
          <div className="text-center mb-10">
            <h2 className="section-title">Questions</h2>
            <p className="section-subtitle">Straight answers before you book.</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {page.faqs.map((faq) => (
              <div key={faq.question} className="surface-card p-5">
                <h3 className="font-bold text-dark mb-1">{faq.question}</h3>
                <p className="text-sm text-gray leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
