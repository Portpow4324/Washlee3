'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Footer from '@/components/Footer'

export default function CookiePolicy() {
  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition">
              <ArrowLeft size={20} />
              <span className="font-semibold">Back Home</span>
            </Link>
            <h1 className="text-xl font-bold text-dark">Washlee</h1>
            <div className="w-20"></div>
          </div>
        </nav>
      </header>

      <main className="min-h-screen bg-light py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-dark mb-2">Cookie Policy</h1>
          <p className="text-gray mb-8">Last updated: January 19, 2026</p>

          <div className="space-y-8 text-gray leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">1. Introduction</h2>
              <p>
                This Cookie Policy explains how Washlee ("we," "us," "our," or "Company") uses cookies and similar tracking technologies on our website and mobile application. We use cookies to enhance your experience, provide personalized content, and improve our services.
              </p>
              <p className="mt-4">
                By using our Service, you acknowledge that you have read and understood this Cookie Policy. If you do not consent to our use of cookies, you can adjust your browser settings or opt out through the mechanisms described below.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">2. What Are Cookies?</h2>
              <p>
                Cookies are small text files stored on your device (computer, smartphone, tablet) when you visit websites. They contain information that websites can retrieve on future visits, allowing us to recognize you and remember your preferences.
              </p>
              <p className="mt-4">
                Cookies are widely used to make websites work more efficiently, improve user experience, and provide analytics about how people use websites.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">3. Types of Cookies We Use</h2>

              <h3 className="text-xl font-semibold text-dark mb-3">3.1 Essential Cookies</h3>
              <p>
                These cookies are necessary for our website to function properly. They enable core functionality such as security, authentication, and load balancing.
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Authentication cookies (remembering you're logged in)</li>
                <li>Security cookies (preventing fraud and unauthorized access)</li>
                <li>Session cookies (maintaining your session state)</li>
              </ul>

              <h3 className="text-xl font-semibold text-dark mb-3 mt-6">3.2 Performance & Analytics Cookies</h3>
              <p>
                These cookies help us understand how users interact with our Service, which pages are visited most, and how long users spend on pages.
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Google Analytics cookies (measuring traffic and user behavior)</li>
                <li>Performance monitoring cookies (tracking application performance)</li>
                <li>Error tracking cookies (identifying technical issues)</li>
              </ul>

              <h3 className="text-xl font-semibold text-dark mb-3 mt-6">3.3 Preference Cookies</h3>
              <p>
                These cookies remember your choices and settings to provide a personalized experience.
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Language preference cookies</li>
                <li>Theme preference cookies (light/dark mode)</li>
                <li>Service preferences cookies</li>
              </ul>

              <h3 className="text-xl font-semibold text-dark mb-3 mt-6">3.4 Marketing & Advertising Cookies</h3>
              <p>
                These cookies track your interests and online activity to deliver targeted advertisements and marketing content.
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Facebook Pixel cookies (retargeting)</li>
                <li>Google Ads cookies (targeted advertising)</li>
                <li>Email marketing cookies (tracking email engagement)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">4. Third-Party Cookies</h2>
              <p>
                Third-party service providers may also place cookies on your device through our Service. These include:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Payment Processors:</strong> Stripe, PayPal (for secure payment processing)</li>
                <li><strong>Analytics Providers:</strong> Google Analytics, Mixpanel</li>
                <li><strong>Social Media:</strong> Facebook, Google (for social login and retargeting)</li>
                <li><strong>Maps & Location:</strong> Google Maps API</li>
              </ul>
              <p className="mt-4">
                We do not control third-party cookies, and this policy does not apply to them. Please review their privacy policies for details on how they use cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">5. How Long Do Cookies Last?</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
                <li><strong>Persistent Cookies:</strong> Remain on your device for a specified period (typically 30 days to 2 years)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">6. Controlling Cookies</h2>

              <h3 className="text-xl font-semibold text-dark mb-3">6.1 Browser Settings</h3>
              <p>
                You can control cookies through your browser settings. Most browsers allow you to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Accept all cookies</li>
                <li>Reject all cookies</li>
                <li>Accept cookies from specific websites</li>
                <li>Delete cookies automatically when closing the browser</li>
              </ul>
              <p className="mt-4">
                <strong>Note:</strong> Disabling cookies may affect the functionality of our Service.
              </p>

              <h3 className="text-xl font-semibold text-dark mb-3 mt-6">6.2 Do Not Track</h3>
              <p>
                Some browsers include a "Do Not Track" feature. We respect DNT signals, but third-party services may not. If you enable DNT, some features may not work as intended.
              </p>

              <h3 className="text-xl font-semibold text-dark mb-3 mt-6">6.3 Cookie Consent</h3>
              <p>
                On your first visit, we display a cookie banner allowing you to accept or decline non-essential cookies. You can change your preferences anytime in your account settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">7. Targeted Advertising & Opt-Out</h2>
              <p>
                If you wish to opt out of targeted advertising, you can:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Visit the Digital Advertising Alliance opt-out page: <span className="text-primary">optout.aboutads.info</span></li>
                <li>Use Google's Ad Settings: <span className="text-primary">myaccount.google.com/ads</span></li>
                <li>Adjust your Facebook ad preferences</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">8. California Privacy Rights</h2>
              <p>
                Under the California Consumer Privacy Act (CCPA), you have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Know what personal information is collected</li>
                <li>Delete personal information (with limited exceptions)</li>
                <li>Opt-out of the sale or sharing of personal information</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, contact us at privacy@washlee.com.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">9. Changes to This Cookie Policy</h2>
              <p>
                We may update this Cookie Policy from time to time. We will notify you of material changes via email or prominent notice on our Service. Your continued use constitutes acceptance of changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">10. Contact</h2>
              <div className="mt-4 p-4 bg-mint rounded-lg">
                <p><strong>Washlee Privacy Team</strong></p>
                <p>Email: privacy@washlee.com</p>
                <p>Support: support@washlee.com</p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
