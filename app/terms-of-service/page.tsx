'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Footer from '@/components/Footer'

export default function TermsOfService() {
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
              <h2 className="text-2xl font-bold text-dark mb-4">3. User Eligibility</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be at least 18 years old.</li>
                <li>You must provide accurate, complete, and current information during registration.</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                <li>You agree not to use the Service for illegal purposes or in violation of any applicable laws.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">4. Service Description</h2>
              <p>
                Washlee connects Customers with Pros to facilitate on-demand laundry services. We act as a marketplace and do not directly perform laundry services. Pros are independent contractors, not employees of Washlee.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">5. Payment Terms</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Prices are subject to change without notice.</li>
                <li>Customers authorize payment methods on file for all Orders.</li>
                <li>Cancellation fees may apply depending on timing.</li>
                <li>Refunds are issued within 5-7 business days.</li>
                <li>Washlee collects payment on behalf of Pros and remits earnings minus service fees.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">6. Customer Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide clear pickup and delivery addresses.</li>
                <li>Ensure laundry is ready at the scheduled time.</li>
                <li>Communicate special care instructions.</li>
                <li>Accept delivered laundry within 24 hours.</li>
                <li>Report any issues or damage claims within 48 hours of delivery.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">7. Pro (Service Provider) Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide professional, high-quality laundry services.</li>
                <li>Follow customer care instructions.</li>
                <li>Maintain reliable pickup and delivery schedules.</li>
                <li>Treat customer property with care.</li>
                <li>Carry appropriate liability insurance.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">8. Limitation of Liability</h2>
              <p>
                TO THE FULLEST EXTENT PERMITTED BY LAW, WASHLEE'S LIABILITY FOR ANY CLAIM ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE TOTAL AMOUNT PAID BY YOU IN THE 12 MONTHS PRECEDING THE CLAIM. WASHLEE SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">9. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless Washlee, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your breach of these Terms or misuse of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">10. Dispute Resolution</h2>
              <p>
                Any disputes shall be resolved through binding arbitration or small claims court. Class actions are prohibited. You waive any right to jury trial.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">11. Termination</h2>
              <p>
                Washlee reserves the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or cause harm to other users or the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">12. Changes to Terms</h2>
              <p>
                Washlee may update these Terms at any time. Continued use of the Service constitutes acceptance of updated Terms. Material changes will be posted with a 30-day notice period.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">13. Governing Law</h2>
              <p>
                These Terms are governed by the laws of Australia and the states in which Washlee operates, without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-dark mb-4">14. Contact</h2>
              <div className="mt-4 p-4 bg-mint rounded-lg">
                <p><strong>Washlee Legal</strong></p>
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
