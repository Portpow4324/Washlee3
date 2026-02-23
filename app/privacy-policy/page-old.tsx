'use client'

import Footer from '@/components/Footer'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicy() {
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
              <p>We use the information we collect for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Processing and fulfilling laundry service orders</li>
                <li>Verifying user identity and preventing fraud</li>
                <li>Processing payments and managing accounts</li>
                <li>Communicating with you about orders, promotions, and updates</li>
                <li>Improving our Service and developing new features</li>
                <li>Personalizing your experience and showing relevant advertisements</li>
                <li>Conducting research, analytics, and performance monitoring</li>
                <li>Complying with legal obligations and enforcing our Terms of Service</li>
                <li>Protecting against fraud, abuse, and security threats</li>
                <li>Background checks and identity verification for Pro users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">4. How We Share Your Information</h2>
              <p>We may share your information in the following circumstances:</p>

              <h3 className="text-xl font-semibold text-dark mb-3 mt-4">4.1 Service Providers</h3>
              <p>
                We share information with third-party service providers who assist us in operating our Service, including payment processors, hosting providers, analytics companies, identity verification services, background check providers, and customer support platforms.
              </p>

              <h3 className="text-xl font-semibold text-dark mb-3 mt-4">4.2 Other Users</h3>
              <p>
                When you place an order, we share your name, phone number, delivery address, and special instructions with the assigned Pro to facilitate service delivery. Customers may view limited Pro profile information (name, rating, reviews, service area).
              </p>

              <h3 className="text-xl font-semibold text-dark mb-3 mt-4">4.3 Legal Requirements</h3>
              <p>
                We may disclose your information when required by law, court order, government request, or to protect our legal rights, privacy, safety, or property, or that of our users or the public.
              </p>

              <h3 className="text-xl font-semibold text-dark mb-3 mt-4">4.4 Business Transfers</h3>
              <p>
                In the event of merger, acquisition, bankruptcy, or sale of assets, your information may be transferred as part of that transaction. We will provide notice before your information becomes subject to a different privacy policy.
              </p>

              <h3 className="text-xl font-semibold text-dark mb-3 mt-4">4.5 Aggregated Data</h3>
              <p>
                We may share anonymized, aggregated data with third parties for research, marketing, and analytics purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">5. Data Security</h2>
              <p>
                We implement industry-standard security measures, including encryption (SSL/TLS), firewalls, and secure authentication protocols to protect your information from unauthorized access, alteration, disclosure, or destruction.
              </p>
              <p className="mt-4">
                However, no security system is impenetrable. While we strive to protect your information, we cannot guarantee absolute security. You acknowledge the inherent risks associated with transmitting information over the internet.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">6. Your Privacy Rights</h2>
              <p>Depending on your jurisdiction, you may have the following rights:</p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li><strong>Access:</strong> You may request access to the personal information we hold about you.</li>
                <li><strong>Correction:</strong> You may request correction of inaccurate or incomplete information.</li>
                <li><strong>Deletion:</strong> You may request deletion of your personal information (subject to legal retention requirements).</li>
                <li><strong>Portability:</strong> You may request a copy of your information in a portable format.</li>
                <li><strong>Opt-Out:</strong> You may opt out of marketing communications and certain data processing activities.</li>
                <li><strong>Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights.</li>
              </ul>
              <p className="mt-4">
                To exercise any of these rights, please contact us at privacy@washlee.com with details of your request.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">7. Retention of Information</h2>
              <p>
                We retain your personal information for as long as necessary to provide our Service and fulfill the purposes outlined in this Privacy Policy. Retention periods vary depending on the purpose of processing and legal requirements.
              </p>
              <p className="mt-4">
                For example, we retain transaction records for tax and accounting purposes for up to 7 years, identity verification documents for compliance purposes, and marketing data until you opt out.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">8. Children's Privacy</h2>
              <p>
                Our Service is not intended for users under 18 years of age. We do not knowingly collect personal information from children under 18. If we become aware that a child under 18 has provided us with personal information, we will promptly delete such information and terminate the child's account.
              </p>
              <p className="mt-4">
                If you believe a child has provided us with personal information, please contact us immediately at privacy@washlee.com.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">9. Third-Party Links</h2>
              <p>
                Our Service may contain links to third-party websites, applications, and services that are not operated by us. This Privacy Policy does not apply to third-party sites, and we are not responsible for their privacy practices. We encourage you to review their privacy policies before providing any information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">10. Cookies and Tracking Technologies</h2>
              <p>
                We use cookies, web beacons, pixels, and similar tracking technologies to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Remember your preferences and login information</li>
                <li>Analyze user behavior and website performance</li>
                <li>Deliver personalized content and advertisements</li>
                <li>Prevent fraud and ensure security</li>
              </ul>
              <p className="mt-4">
                You can control cookie preferences through your browser settings. However, disabling cookies may limit functionality of our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">11. International Data Transfers</h2>
              <p>
                If you are located outside Australia, please note that your information may be transferred to, stored in, and processed in Australia or other countries where our servers are located. By using our Service, you consent to such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">12. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes by posting the updated policy on our website with a new "Last Updated" date.
              </p>
              <p className="mt-4">
                Your continued use of our Service after changes become effective constitutes your acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">13. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, wish to exercise your privacy rights, or have concerns about our privacy practices, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-mint rounded-lg">
                <p><strong>Washlee</strong></p>
                <p>Email: privacy@washlee.com</p>
                <p>Email: support@washlee.com</p>
                <p>Response time: 30 days</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
