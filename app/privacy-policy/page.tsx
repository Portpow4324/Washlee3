'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'

const LAST_UPDATED = '14 May 2026'

const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: '1. Who we are',
    body: (
      <p>
        Washlee (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the Washlee laundry pickup and delivery service in Greater Melbourne. We are committed to handling personal information in accordance with the Australian <em>Privacy Act 1988 (Cth)</em> and the Australian Privacy Principles (APPs).
      </p>
    ),
  },
  {
    title: '2. Information we collect',
    body: (
      <>
        <p className="mb-3">We collect personal information you provide directly when you sign up, place orders, or contact us, including:</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Name, email address, phone number, and pickup/delivery addresses.</li>
          <li>Order details, special care notes, and communications with our team or a Washlee Pro.</li>
          <li>Payment information processed securely by Stripe — Washlee does not store full card numbers.</li>
          <li>For Pros: identity verification, banking details for payouts, and proof of right to work.</li>
        </ul>
        <p className="mt-3">We also collect technical information automatically when you use the website or app — device type, browser, IP address, approximate or precise location (with permission), and analytics events.</p>
      </>
    ),
  },
  {
    title: '3. How we use your information',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Operate, deliver, and improve the service.</li>
        <li>Confirm bookings, manage pickups and deliveries, and process payments.</li>
        <li>Send order updates and (with consent) marketing emails.</li>
        <li>Prevent fraud and meet legal obligations.</li>
        <li>Diagnose issues and improve performance.</li>
      </ul>
    ),
  },
  {
    title: '4. Who we share information with',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Your assigned Washlee Pro receives the pickup and delivery details needed to complete the order.</li>
        <li>Service providers we rely on — including Stripe (payments), Supabase (data hosting), Resend (email), Google (Maps, Places), and analytics providers — operating under their own privacy commitments.</li>
        <li>Authorities, where required by Australian law.</li>
      </ul>
    ),
  },
  {
    title: '5. Storage and security',
    body: (
      <p>
        Your information is stored on secure, encrypted servers operated by our cloud providers. We use industry-standard security controls and access restrictions, but no system is 100% secure.
      </p>
    ),
  },
  {
    title: '6. Your rights under the Privacy Act',
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong>Access</strong> the personal information we hold about you.</li>
        <li><strong>Correct</strong> information that is inaccurate or out of date.</li>
        <li><strong>Delete</strong> your account and personal data, subject to legal record-keeping requirements.</li>
        <li><strong>Opt out</strong> of marketing emails at any time.</li>
        <li><strong>Complain</strong> to us, and to the Office of the Australian Information Commissioner (OAIC) if a concern is unresolved.</li>
      </ul>
    ),
  },
  {
    title: '7. Cookies',
    body: (
      <p>
        We use cookies and similar technologies to keep you signed in, remember preferences, and understand how the site is used. See our <Link href="/cookie-policy" className="text-primary-deep font-semibold hover:underline">Cookie Policy</Link> for details.
      </p>
    ),
  },
  {
    title: '8. Children',
    body: (
      <p>
        Washlee is not directed at children under 16. We do not knowingly collect personal information from children. If you believe a child has provided us with information, please contact us and we will delete it.
      </p>
    ),
  },
  {
    title: '9. Data location',
    body: (
      <p>
        Your information is hosted with cloud providers that may store data in Australia or overseas (including the United States and Singapore). We take reasonable steps to ensure they handle your information consistently with the APPs.
      </p>
    ),
  },
  {
    title: '10. Retention',
    body: (
      <p>
        We keep personal information only as long as needed to operate the service and meet our legal and tax obligations. You can request deletion of your account from your settings or by contacting us.
      </p>
    ),
  },
  {
    title: '11. Changes to this policy',
    body: (
      <p>
        We may update this policy from time to time. The latest version will always be available on this page, and material changes will be highlighted in-app or by email.
      </p>
    ),
  },
]

export default function PrivacyPolicyPage() {
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
              <h1 className="h2 text-dark mb-1">Privacy policy</h1>
              <p className="text-sm text-gray-soft mb-8">Last updated: {LAST_UPDATED}</p>

              <div className="space-y-7 text-sm sm:text-base text-gray leading-relaxed">
                {sections.map((s) => (
                  <section key={s.title}>
                    <h2 className="text-lg sm:text-xl font-bold text-dark mb-2">{s.title}</h2>
                    <div className="text-gray">{s.body}</div>
                  </section>
                ))}

                <section>
                  <h2 className="text-lg sm:text-xl font-bold text-dark mb-2">12. Contact us</h2>
                  <div className="rounded-2xl bg-mint/60 border border-primary/15 p-5 text-sm text-dark">
                    <p className="font-semibold mb-1">Washlee Privacy</p>
                    <p className="text-gray mb-3">Greater Melbourne, Australia</p>
                    <a
                      href="mailto:privacy@washlee.com.au"
                      className="inline-flex items-center gap-2 font-semibold text-primary-deep hover:underline"
                    >
                      <Mail size={14} />
                      privacy@washlee.com.au
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
