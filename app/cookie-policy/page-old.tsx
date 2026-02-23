'use client'

import Footer from '@/components/Footer'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CookiePolicy() {
  return (
    <>
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-primary font-bold text-lg hover:text-primary/80 transition flex items-center gap-2">
                <ArrowLeft size={20} />
                Back to Home
              </Link>
            </div>
            <h1 className="text-xl font-bold text-dark">Washlee</h1>
          </div>
        </nav>
      </header>

      <main className="min-h-screen bg-light py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-dark mb-2">Cookie Policy</h1>
          <p className="text-gray mb-8">Last updated: January 19, 2026</p>

          <div className="space-y-8 text-gray leading-relaxed">
            <p className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded">
              Note: This Cookie Policy is a general template and does not constitute legal advice. Consult a lawyer to ensure compliance with applicable laws such as the Privacy Act 1988 and ePrivacy rules where relevant.
            </p>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">1. Introduction</h2>
              <p>
                We use cookies and similar technologies to recognise you and your preferences, to provide a better user experience, and for analytics and advertising purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">2. What are cookies?</h2>
              <p>
                Cookies are small text files placed on your device that store information about your visit. They help us remember preferences and understand how you use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">3. Types of cookies we use</h2>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Strictly necessary cookies:</strong> Required for the website to operate and cannot be switched off.</li>
                <li><strong>Performance & analytics cookies:</strong> Help us understand usage and improve the Service (e.g., Google Analytics).</li>
                <li><strong>Functional cookies:</strong> Remember choices you make (language, preferences).</li>
                <li><strong>Advertising & targeting cookies:</strong> Used to deliver relevant ads and measure ad performance (may be set by third parties).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">4. Third-party cookies</h2>
              <p>
                We allow third parties (analytics providers, ad networks) to set cookies on our site. These third parties have their own cookie policies and choices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">5. How to control cookies</h2>
              <p>
                You can manage cookies through your browser settings. You can usually block or delete cookies via settings in your browser. Note that disabling cookies may affect site functionality. For advertising opt-outs, visit tools such as <a className="text-primary underline" href="https://youradchoices.com/" target="_blank" rel="noreferrer">YourAdChoices</a> or platform-specific settings (Google, Facebook).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">6. Changes to this Cookie Policy</h2>
              <p>
                We may update this Cookie Policy from time to time. We will notify users of material changes by posting the updated policy with a revised "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">7. Contact</h2>
              <div className="mt-4 p-4 bg-mint rounded-lg">
                <p><strong>Washlee</strong></p>
                <p>Email: legal@washlee.com</p>
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
