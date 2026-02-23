'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Footer from '@/components/Footer'

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl font-bold text-dark mb-2">Privacy Policy</h1>
          <p className="text-gray mb-8">Last updated: January 19, 2026</p>

          <div className="space-y-8 text-gray leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">1. Introduction</h2>
              <p>
                Washlee ("we," "us," "our," or "Company") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, mobile application, and related services (collectively, the "Service").
              </p>
              <p className="mt-4">
                Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our Service. By accessing and using Washlee, you acknowledge that you have read, understood, and agree to be bound by all the terms of this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold text-dark mb-3">2.1 Information You Provide Directly</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Registration:</strong> Name, email address, phone number, residential address, payment information, date of birth, and government-issued identification (for Pro users).</li>
                <li><strong>Service Usage:</strong> Pickup and delivery addresses, laundry preferences, special instructions, and order history.</li>
                <li><strong>Payment Information:</strong> Credit card details, billing address, and transaction history (processed securely via payment providers).</li>
                <li><strong>Communications:</strong> Messages, inquiries, feedback, and support requests you send us.</li>
                <li><strong>Identity Verification:</strong> For Pro users, government-issued IDs, background check information, and banking details for payouts.</li>
              </ul>

              <h3 className="text-xl font-semibold text-dark mb-3 mt-6">2.2 Information Collected Automatically</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers, browser type, and IP address.</li>
                <li><strong>Usage Data:</strong> Pages visited, time spent on pages, links clicked, and referring URL.</li>
                <li><strong>Location Data:</strong> Precise GPS location (with your permission) to facilitate service delivery and track order progress.</li>
                <li><strong>Cookies & Tracking:</strong> We use cookies, pixels, and similar technologies to enhance your experience and analyze user behavior.</li>
              </ul>

              <h3 className="text-xl font-semibold text-dark mb-3 mt-6">2.3 Third-Party Information</h3>
              <p>
                We may receive information from third parties, including payment processors, identity verification services, background check providers, and analytics platforms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, improve, and personalize our Service.</li>
                <li>Process payments and handle transactions.</li>
                <li>Verify identity and prevent fraud.</li>
                <li>Communicate with you about orders, support, and updates.</li>
                <li>Comply with legal and regulatory obligations.</li>
                <li>Conduct analytics and understand user behavior.</li>
                <li>Send promotional materials (with your opt-in consent).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">4. How We Share Your Information</h2>
              <p>We may disclose your information to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li><strong>Service Providers:</strong> Payment processors, cloud hosting providers, analytics companies.</li>
                <li><strong>Pros:</strong> Essential pickup/delivery information needed to fulfill your order.</li>
                <li><strong>Law Enforcement:</strong> When legally required or to prevent harm.</li>
                <li><strong>Business Partners:</strong> For marketing or service improvement (with your consent).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">5. Data Security</h2>
              <p>
                We implement industry-standard security measures, including encryption, firewalls, and access controls. However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security of your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">6. Your Privacy Rights</h2>
              <h3 className="text-xl font-semibold text-dark mb-3">6.1 Access & Correction</h3>
              <p>You have the right to access, review, and request corrections to your personal information.</p>

              <h3 className="text-xl font-semibold text-dark mb-3 mt-4">6.2 Deletion</h3>
              <p>You may request deletion of your account and associated personal data, subject to legal retention requirements.</p>

              <h3 className="text-xl font-semibold text-dark mb-3 mt-4">6.3 Opt-Out</h3>
              <p>You can opt out of marketing communications at any time by clicking the unsubscribe link in emails or adjusting account settings.</p>

              <h3 className="text-xl font-semibold text-dark mb-3 mt-4">6.4 Portability</h3>
              <p>You have the right to request your data in a portable format.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">7. Cookies & Tracking Technologies</h2>
              <p>
                We use cookies and similar technologies to remember preferences, analyze usage patterns, and deliver targeted content. You can control cookies through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">8. Third-Party Links</h2>
              <p>
                Our Service may contain links to third-party websites. We are not responsible for their privacy practices. Please review their policies before providing information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">9. Children's Privacy</h2>
              <p>
                Our Service is not intended for children under 13. We do not knowingly collect information from children under 13. If we become aware of such collection, we will take immediate steps to delete the information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">10. International Data Transfers</h2>
              <p>
                If you are located outside Australia, your information may be transferred to and processed in Australia. By using our Service, you consent to such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">11. Data Retention</h2>
              <p>
                We retain personal information for as long as necessary to provide our Service and comply with legal obligations. You can request deletion at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">12. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy periodically. We will notify you of material changes via email or prominent notice on our Service. Your continued use constitutes acceptance of changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">13. Contact</h2>
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
