'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'

const LAST_UPDATED = '14 May 2026'

const cookieTypes = [
  {
    name: 'Strictly necessary',
    purpose:
      'Keep you signed in, remember your basket, and route requests to the right server. The site can&rsquo;t work without these.',
    examples: 'Auth session, CSRF token, language preference',
  },
  {
    name: 'Functional',
    purpose: 'Remember preferences like your address, default delivery speed, and Wash Club opt-in.',
    examples: 'Saved address selection, dismissed banners',
  },
  {
    name: 'Analytics',
    purpose: 'Help us understand how customers use Washlee so we can fix friction and ship improvements.',
    examples: 'Page views, anonymous device info, performance metrics',
  },
  {
    name: 'Marketing',
    purpose:
      'Measure campaign effectiveness and (with consent) personalise communications. Off by default until you accept marketing in the cookie banner.',
    examples: 'Campaign attribution, conversion tracking',
  },
]

export default function CookiePolicyPage() {
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
              <h1 className="h2 text-dark mb-1">Cookie policy</h1>
              <p className="text-sm text-gray-soft mb-8">Last updated: {LAST_UPDATED}</p>

              <div className="space-y-7 text-sm sm:text-base text-gray leading-relaxed">
                <section>
                  <h2 className="text-lg sm:text-xl font-bold text-dark mb-2">1. What cookies are</h2>
                  <p>
                    Cookies are small text files stored on your device when you visit a website. They help sites remember things like login state and preferences. We use cookies and similar technologies (e.g. local storage and pixels) to operate Washlee.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg sm:text-xl font-bold text-dark mb-2">2. Types of cookies we use</h2>
                  <div className="space-y-4">
                    {cookieTypes.map((c) => (
                      <div
                        key={c.name}
                        className="rounded-2xl border border-line bg-white p-4 sm:p-5"
                      >
                        <p className="font-bold text-dark mb-1">{c.name}</p>
                        <p
                          className="text-sm text-gray mb-2"
                          dangerouslySetInnerHTML={{ __html: c.purpose }}
                        />
                        <p className="text-xs text-gray-soft uppercase tracking-wider font-semibold">
                          Examples
                        </p>
                        <p className="text-xs text-gray">{c.examples}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="text-lg sm:text-xl font-bold text-dark mb-2">3. Third-party cookies</h2>
                  <p>
                    Some cookies come from trusted third parties we use to run Washlee — including Stripe (payments), Google (maps and analytics), and Resend (transactional email). They have their own privacy policies.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg sm:text-xl font-bold text-dark mb-2">4. Your choices</h2>
                  <p className="mb-2">
                    You can change your cookie preferences at any time using the cookie banner or by clearing cookies in your browser settings. Disabling strictly necessary cookies will break the site, so we don&rsquo;t recommend that.
                  </p>
                  <p>
                    Marketing and analytics cookies only run with your consent.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg sm:text-xl font-bold text-dark mb-2">5. Australian Privacy Act</h2>
                  <p>
                    For details on how we handle personal information collected via cookies, see our{' '}
                    <Link href="/privacy-policy" className="text-primary-deep font-semibold hover:underline">
                      Privacy Policy
                    </Link>
                    . We comply with the Australian Privacy Act 1988 and the Australian Privacy Principles.
                  </p>
                </section>

                <section>
                  <h2 className="text-lg sm:text-xl font-bold text-dark mb-2">6. Updates</h2>
                  <p>We may update this policy. The latest version will always be on this page.</p>
                </section>

                <section>
                  <h2 className="text-lg sm:text-xl font-bold text-dark mb-2">7. Contact</h2>
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
