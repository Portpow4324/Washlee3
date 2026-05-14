'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { ArrowLeft, Mail, AlertCircle } from 'lucide-react'

const LAST_UPDATED = '14 May 2026'

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: '1. About these terms',
    body: (
      <p>
        These Terms of Service form a binding agreement between you and Washlee. By creating an account or placing an order, you agree to these terms. If you don&rsquo;t agree, please don&rsquo;t use the service.
      </p>
    ),
  },
  {
    title: '2. Definitions',
    body: (
      <p>
        &ldquo;Customer&rdquo; means a user who books a Washlee laundry order. &ldquo;Pro&rdquo; means an independent contractor who picks up, processes, and delivers laundry. &ldquo;Order&rdquo; means a booking placed through the Washlee app or website.
      </p>
    ),
  },
  {
    title: '3. Eligibility',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>You must be at least 18 years old.</li>
        <li>You must provide accurate account and contact details.</li>
        <li>You are responsible for keeping your account credentials secure.</li>
        <li>You must use Washlee in line with Australian law.</li>
      </ul>
    ),
  },
  {
    title: '4. The service',
    body: (
      <p>
        Washlee operates a marketplace that pairs Customers with vetted Pros for laundry pickup, washing, folding, and delivery within our Melbourne service area. Pros are independent contractors, not employees of Washlee, and are paid commission per completed order.
      </p>
    ),
  },
  {
    title: '5. Pricing &amp; payment',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Standard wash &amp; fold: <strong>$7.50/kg</strong>. Express same-day: <strong>$12.50/kg</strong>.</li>
        <li>Minimum order: <strong>$75 (AUD, GST inclusive)</strong>.</li>
        <li>Final price is based on actual weight after washing.</li>
        <li>Payment is taken when the order is finalised, via Stripe.</li>
        <li>Cancellation fees may apply once a Pro has been dispatched — see in-order details.</li>
        <li>Refunds (where applicable) are returned to your original payment method within 3–5 business days.</li>
      </ul>
    ),
  },
  {
    title: '6. Customer responsibilities',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Provide a safe, accessible pickup and delivery address.</li>
        <li>Have laundry ready at the agreed time.</li>
        <li>Flag delicates, dry-clean-only items, and special care notes at booking.</li>
        <li>Report concerns or damage claims via the order page within 14 days of delivery.</li>
      </ul>
    ),
  },
  {
    title: '7. Pro responsibilities',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Provide professional, courteous service.</li>
        <li>Follow customer care notes.</li>
        <li>Treat customer items and property with care.</li>
        <li>Carry the appropriate vehicle and personal cover for their work.</li>
      </ul>
    ),
  },
  {
    title: '8. Australian Consumer Law',
    body: (
      <p>
        Nothing in these terms excludes, restricts, or modifies any guarantee, right, or remedy you have under the Australian Consumer Law (Schedule 2 to the <em>Competition and Consumer Act 2010 (Cth)</em>). Our services come with guarantees that cannot be excluded under the Australian Consumer Law.
      </p>
    ),
  },
  {
    title: '9. Liability',
    body: (
      <p>
        Subject to the Australian Consumer Law and your Wash Club / damage protection coverage, Washlee&rsquo;s liability for any claim arising out of these terms is limited to the amount paid by you for the relevant order. Washlee is not liable for indirect or consequential loss to the extent permitted by law.
      </p>
    ),
  },
  {
    title: '10. Termination',
    body: (
      <p>
        Washlee may suspend or close accounts that breach these terms, engage in fraudulent activity, or pose a safety risk to customers or Pros. You may close your account at any time from your settings.
      </p>
    ),
  },
  {
    title: '11. Changes',
    body: (
      <p>
        We may update these terms from time to time. Material changes will be communicated by email or in-app notice at least 14 days before they take effect.
      </p>
    ),
  },
  {
    title: '12. Governing law',
    body: (
      <p>
        These terms are governed by the laws of Victoria, Australia. Any dispute will be handled by the courts of Victoria, Australia, unless the law requires otherwise.
      </p>
    ),
  },
]

export default function TermsOfServicePage() {
  return (
    <>
      <Header />
      <main className="bg-soft-mint min-h-screen pb-16">
        <div className="container-page pt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary-deep font-semibold text-sm mb-6 hover:text-primary"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>

          <div className="max-w-3xl mx-auto">
            <div className="surface-card p-6 sm:p-10">
              <h1 className="h2 text-dark mb-1">Terms of service</h1>
              <p className="text-sm text-gray-soft mb-6">Last updated: {LAST_UPDATED}</p>

              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-8 flex gap-2">
                <AlertCircle size={18} className="text-amber-700 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 leading-relaxed">
                  This is general operating terms for the Washlee service. It is not legal advice. Have your own legal advisor review these terms before relying on them for any specific use case.
                </p>
              </div>

              <div className="space-y-7 text-sm sm:text-base text-gray leading-relaxed">
                {sections.map((s) => (
                  <section key={s.title}>
                    <h2 className="text-lg sm:text-xl font-bold text-dark mb-2">{s.title}</h2>
                    <div className="text-gray">{s.body}</div>
                  </section>
                ))}

                <section>
                  <h2 className="text-lg sm:text-xl font-bold text-dark mb-2">13. Contact us</h2>
                  <div className="rounded-2xl bg-mint/60 border border-primary/15 p-5 text-sm text-dark">
                    <p className="font-semibold mb-1">Washlee</p>
                    <p className="text-gray mb-3">Greater Melbourne, Australia</p>
                    <a
                      href="mailto:legal@washlee.com.au"
                      className="inline-flex items-center gap-2 font-semibold text-primary-deep hover:underline"
                    >
                      <Mail size={14} />
                      legal@washlee.com.au
                    </a>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
