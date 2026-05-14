'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Link from 'next/link'
import { Shield, Lock, Check, AlertCircle, Phone, Mail } from 'lucide-react'

export default function SecurityPage() {
  return (
    <>
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-mint to-white py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <Shield size={60} className="text-primary" />
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-dark mb-6">Your Safety & Privacy Matter</h1>
            <p className="text-xl text-gray max-w-2xl mx-auto">
              We protect your clothes, your home, and your personal information with the highest standards of care and security.
            </p>
          </div>
        </div>
      </section>

      {/* Security Overview */}
      <section className="section bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-dark text-center mb-12">Enterprise-Grade Security</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Lock size={32} className="text-primary" />, title: 'SSL Encryption', desc: '256-bit encryption protects all data' },
              { icon: <Shield size={32} className="text-primary" />, title: 'PCI Compliance', desc: 'Payment data meets industry standards' },
              { icon: <Check size={32} className="text-primary" />, title: '2FA Security', desc: 'Two-factor authentication available' },
              { icon: <AlertCircle size={32} className="text-primary" />, title: 'Privacy First', desc: 'Your data is never sold or shared' },
            ].map((item, i) => (
              <Card key={i} className="text-center">
                <div className="flex justify-center mb-4">{item.icon}</div>
                <h3 className="font-bold text-dark mb-2">{item.title}</h3>
                <p className="text-sm text-gray">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How We Handle Your Clothes */}
      <section className="section bg-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-dark text-center mb-12">How We Handle Your Clothes</h2>
          
          <div className="space-y-6">
            {[
              {
                step: '1',
                title: 'Pickup & Inspection',
                description: 'We photograph and document each item for your protection. You receive photos in the app.',
              },
              {
                step: '2',
                title: 'Secure Storage',
                description: 'Items are sorted by fabric type and stored in climate-controlled facilities.',
              },
              {
                step: '3',
                title: 'Professional Washing',
                description: 'Trained technicians follow specific protocols based on fabric care labels.',
              },
              {
                step: '4',
                title: 'Quality Check',
                description: 'Every item is inspected before delivery for quality and condition.',
              },
              {
                step: '5',
                title: 'Secure Delivery',
                description: 'Delivered in sealed, protective packaging straight to your door.',
              },
            ].map((item, i) => (
              <Card key={i} className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-white font-bold">
                    {item.step}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-dark mb-2">{item.title}</h3>
                  <p className="text-gray">{item.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Damage Protection */}
      <section className="section bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-dark text-center mb-12">Damage Protection Guarantee</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card hoverable>
              <h3 className="text-2xl font-bold text-primary mb-4">What's Covered?</h3>
              <ul className="space-y-3">
                {[
                  'Tears, rips, or holes',
                  'Color fading or bleeding',
                  'Shrinkage beyond normal',
                  'Lost buttons or zippers',
                  'Stains from our process',
                  'Accidental damage during handling',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check size={20} className="text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-gray">{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card hoverable>
              <h3 className="text-2xl font-bold text-primary mb-4">Our Promise</h3>
              <div className="space-y-4">
                <div>
                  <p className="font-bold text-dark mb-2">Full Item Replacement</p>
                  <p className="text-gray text-sm">If damage occurs, we replace the item with a new one of equal or greater value, completely free.</p>
                </div>
                <div>
                  <p className="font-bold text-dark mb-2">No Hassle Process</p>
                  <p className="text-gray text-sm">Just report damage in the app. We'll handle the rest with zero questions asked.</p>
                </div>
                <div>
                  <p className="font-bold text-dark mb-2">30-Day Window</p>
                  <p className="text-gray text-sm">Report damage up to 30 days after delivery for full coverage.</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-8 bg-mint rounded-lg p-6 border-2 border-primary/20">
            <h4 className="font-bold text-dark mb-3">Why We're Different</h4>
            <p className="text-gray mb-4">
              Unlike traditional dry cleaning, we don't hide behind damage waivers or small print. We stand behind our work 100%. Your clothes matter to you, and they matter to us.
            </p>
            <p className="text-primary font-semibold">
              99.2% of customers report no damage - and we're obsessed with reaching 100%.
            </p>
          </div>
        </div>
      </section>

      {/* Privacy & Data */}
      <section className="section bg-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-dark text-center mb-12">Your Privacy is Sacred</h2>
          
          <div className="space-y-6">
            <Card>
              <h3 className="text-2xl font-bold text-dark mb-3">We Never:</h3>
              <ul className="space-y-2 text-gray">
                {[
                  '❌ Sell or share your personal data with third parties',
                  '❌ Use your information for marketing to other companies',
                  '❌ Store payment information on our servers',
                  '❌ Track your location without permission',
                  '❌ Access your account without authorization',
                ].map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </Card>

            <Card>
              <h3 className="text-2xl font-bold text-dark mb-3">Data Protection Methods:</h3>
              <ul className="space-y-2 text-gray">
                {[
                  '✓ Encrypted in transit and at rest',
                  '✓ PCI DSS Level 1 payments via Stripe',
                  '✓ Aligned with the Australian Privacy Act 1988 and APPs',
                  '✓ Regular security reviews',
                  '✓ Continuous fraud monitoring',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check size={18} className="text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <h3 className="text-2xl font-bold text-dark mb-3">Your Rights:</h3>
              <p className="text-gray mb-4">
                You have the right to access, modify, or delete your personal data at any time. We make it easy:
              </p>
              <ul className="space-y-2 text-gray">
                {[
                  '• Request all your data in one click',
                  '• Update your information anytime',
                  '• Delete your account and all associated data',
                  '• Opt-out of communications',
                  '• Download your history',
                ].map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="section bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-dark text-center mb-12">Trusted & Certified</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { logo: '🔒', name: 'SSL encryption' },
              { logo: '✓', name: 'PCI DSS L1 (Stripe)' },
              { logo: '🛡️', name: 'Privacy Act 1988' },
              { logo: '📋', name: 'Australian Privacy Principles' },
              { logo: '🔁', name: 'Backups &amp; recovery' },
              { logo: '🇦🇺', name: 'Melbourne-based team' },
              { logo: '👁️', name: '24/7 monitoring' },
              { logo: '💬', name: 'In-app support' },
            ].map((badge, i) => (
              <Card key={i}>
                <div className="text-4xl mb-2">{badge.logo}</div>
                <p className="font-semibold text-dark text-sm">{badge.name}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section bg-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-dark text-center mb-12">Security FAQ</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Is my payment information stored?',
                a: 'No. We use Stripe for payment processing, which meets PCI DSS Level 1 standards. We never store your full card details.',
              },
              {
                q: 'Can I see my items being washed?',
                a: 'Yes! We photograph and document each item. You can track your order in real-time in the app.',
              },
              {
                q: 'What if my clothes go missing?',
                a: 'Report it immediately. We cover the full replacement cost with our missing item guarantee.',
              },
              {
                q: 'How long do you keep my data?',
                a: 'We keep your account and transaction history as long as you want. Delete anytime from your settings.',
              },
              {
                q: 'Who has access to my address?',
                a: 'Only our verified delivery partners and operations team. Your address is encrypted and never shared.',
              },
            ].map((item, i) => (
              <Card key={i}>
                <h3 className="font-bold text-dark mb-2">{item.q}</h3>
                <p className="text-gray">{item.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="section bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-dark mb-6">Security Questions?</h2>
          <p className="text-lg text-gray mb-8">Our security team is here to help.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:security@washlee.com.au" className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:shadow-lg transition">
              <Mail size={20} />
              Email security team
            </a>
            <a href="mailto:support@washlee.com.au" className="flex items-center justify-center gap-2 px-6 py-3 bg-gray/10 text-dark rounded-lg font-semibold hover:bg-gray/20 transition">
              <Phone size={20} />
              General support
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
