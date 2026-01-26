'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function TermsOfService() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-light py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-dark mb-2">Terms of Service</h1>
          <p className="text-gray mb-8">Last updated: January 19, 2026</p>

          <div className="space-y-8 text-gray leading-relaxed">
            <p className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded">
              Note: This document is a general template and does not constitute legal advice. You should have these Terms reviewed by a qualified lawyer to ensure they meet legal requirements for your business and jurisdiction.
            </p>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">1. Agreement to Terms</h2>
              <p>
                These Terms of Service ("Terms") are a legally binding agreement between you ("User," "you" or "your") and Washlee ("we," "us," or "our"). By accessing or using our website, mobile application, or services (collectively, the "Service"), you agree to these Terms. If you do not agree, do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">2. Definitions</h2>
              <p>
                "Customer" means a user who requests laundry services. "Pro" means an independent provider who performs pickup, cleaning and delivery services. "Order" means a request for laundry services placed through the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">3. Eligibility and Accounts</h2>
              <p>
                You must be at least 18 years old and able to form a binding contract to use the Service. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">4. Services and Orders</h2>
              <p>
                We provide a platform that connects Customers with Pros. We are not the provider of laundry services; Pros are independent contractors. We make reasonable efforts to ensure the quality of the Service, but actual service performance is the responsibility of the assigned Pro.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">5. Payments and Fees</h2>
              <p>
                Payment terms, pricing, fees and any applicable surcharges will be clearly displayed at checkout. Payments are processed through third-party payment processors. You agree to pay all fees and applicable taxes. Refunds are provided in accordance with our Refund Policy or as required by applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">6. Customer Obligations</h2>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Provide accurate order and address information.</li>
                <li>Ensure items are packed or ready for pickup as required.</li>
                <li>Remove valuables, fragile or prohibited items before pickup.</li>
                <li>Comply with any specific instructions for access or health/safety requirements.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">7. Pro Conduct and Vetting</h2>
              <p>
                Pros are independent contractors and are expected to follow our guidelines. We may conduct identity verification, background checks, and require bank details for payouts. We do not guarantee any Pro's performance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">8. Intellectual Property</h2>
              <p>
                All content on the Service (text, logos, images, designs) is owned or licensed by us. You may not copy, reproduce or use our intellectual property without our prior written consent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">9. Warranties and Disclaimers</h2>
              <p>
                To the maximum extent permitted by law, the Service is provided "as is" and "as available" without warranties of any kind. We do not warrant uninterrupted or error-free operation. Any advice or information provided through the Service is for general information only.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">10. Limitation of Liability</h2>
              <p>
                Except where prohibited by law, our liability to you for any direct loss or damage arising under or in connection with these Terms is limited to the amount you paid to us in the 12 months preceding the claim. We are not liable for indirect, special, incidental, or consequential losses.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">11. Indemnification</h2>
              <p>
                You agree to indemnify and hold us harmless from claims, losses, damages, liabilities, and expenses arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">12. Termination</h2>
              <p>
                We may suspend or terminate accounts for breaches of these Terms, fraudulent activity, or other lawful reasons. You may close your account by following account settings or contacting support.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">13. Governing Law and Dispute Resolution</h2>
              <p>
                These Terms are governed by the laws of New South Wales, Australia. Any disputes will be resolved in the courts of New South Wales to the extent permitted by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">14. Changes to These Terms</h2>
              <p>
                We may update these Terms from time to time. Material changes will be notified by posting the updated Terms and changing the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">15. Contact</h2>
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
