'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import { useState } from 'react'
import { ChevronDown, Mail, Phone, MessageSquare } from 'lucide-react'

export default function FAQ() {
  const [openFaq, setOpenFaq] = useState<string | null>(null)

  const faqCategories = [
    {
      title: 'Getting Started',
      questions: [
        {
          q: 'How do I get started with Washlee?',
          a: 'Sign up in minutes using email or Google. Download the app or use our website to schedule your first pickup.',
        },
        {
          q: 'What areas do you service?',
          a: 'We currently service 50+ cities across Australia. Enter your postcode on our homepage to check if we deliver to you.',
        },
        {
          q: 'Can I schedule pickups in advance?',
          a: 'Yes! Book up to 30 days in advance or set up recurring weekly/bi-weekly pickups.',
        },
        {
          q: 'Do I need to prepare my laundry?',
          a: 'No prep needed. Just place your dirty laundry in the Washlee bag. We handle everything else.',
        },
      ],
    },
    {
      title: 'Turnaround Time',
      questions: [
        {
          q: 'How long does it take?',
          a: 'Standard turnaround is 24 hours from pickup. Express service available for +$10.',
        },
        {
          q: 'What if I need my laundry urgently?',
          a: 'Choose Express Service (+$10) for 24-hour guaranteed turnaround.',
        },
        {
          q: 'Can I choose my delivery date?',
          a: 'Yes! Select your preferred delivery date when you schedule pickup.',
        },
        {
          q: 'What if you miss your delivery window?',
          a: 'We offer credits or re-scheduling. Contact support for immediate assistance.',
        },
      ],
    },
    {
      title: 'Pricing & Payment',
      questions: [
        {
          q: 'How is the price calculated?',
          a: 'We charge $3.00/kg for standard wash & fold. Laundry is weighed at our facility after cleaning.',
        },
        {
          q: 'Are there any hidden fees?',
          a: 'Absolutely not. The price you see is what you pay, including delivery. No surprise charges.',
        },
        {
          q: 'What payment methods do you accept?',
          a: 'We accept all major credit cards, debit cards, Apple Pay, Google Pay, and PayPal.',
        },
        {
          q: 'Can I get a refund?',
          a: 'Yes. Refunds issued within 48 hours of request if laundry is not picked up yet.',
        },
      ],
    },
    {
      title: 'Care & Handling',
      questions: [
        {
          q: 'How do you care for delicate items?',
          a: 'Select "Delicate Care" option (+$2/kg) for silk, lace, and fine fabrics. We use gentle wash cycles.',
        },
        {
          q: 'Do you handle stains?',
          a: 'Yes! Add our Stain Treatment service (+$0.50/item) for professional pre-treatment of stubborn stains.',
        },
        {
          q: 'Can I request specific detergent?',
          a: 'Absolutely. Choose from hypoallergenic, eco-friendly, or luxury detergents at checkout.',
        },
        {
          q: 'What about special items like comforters?',
          a: 'We offer Comforter Service ($25) for large items. Dedicated washing with professional care.',
        },
      ],
    },
    {
      title: 'Damage & Issues',
      questions: [
        {
          q: 'What if an item is damaged?',
          a: 'Our Satisfaction Guarantee covers accidental damage. We\'ll replace or provide a full refund.',
        },
        {
          q: 'What if items go missing?',
          a: 'Report missing items within 24 hours. We\'ll investigate and compensate based on item value.',
        },
        {
          q: 'Do you protect valuable items?',
          a: 'We handle all items with care. Declare high-value items for additional insurance coverage.',
        },
        {
          q: 'How do I file a claim?',
          a: 'Use the "Report Issue" button in the app or call support. Claims resolved within 48 hours.',
        },
        {
          q: 'What\'s your satisfaction guarantee exactly?',
          a: '30-day 100% Money-Back Guarantee. If you\'re not satisfied for any reason, we refund you fully. No questions asked.',
        },
        {
          q: 'How do you handle color-bleeding or shrinkage?',
          a: 'We use cold water for colored items and professional drying to prevent shrinkage. Issues covered under our guarantee.',
        },
      ],
    },
    {
      title: 'Sensitive Skin & Allergies',
      questions: [
        {
          q: 'Is Washlee suitable for sensitive skin?',
          a: 'Yes! Choose our Hypoallergenic Detergent option (default is eco-friendly). It\'s dermatologist-tested and fragrance-free.',
        },
        {
          q: 'Can I use my own detergent?',
          a: 'Yes. Bring your detergent and we\'ll use it (no extra charge). Perfect for allergies or specific preferences.',
        },
        {
          q: 'Do you use fabric softeners?',
          a: 'Only if requested. By default, we skip softeners to preserve fabric quality and prevent buildup.',
        },
        {
          q: 'What about kids\' clothes with eczema?',
          a: 'Our Hypoallergenic option is perfect for sensitive skin. Extra rinse cycle available (+$1/kg) for complete detergent removal.',
        },
      ],
    },
    {
      title: 'Special Items & Care',
      questions: [
        {
          q: 'Do you wash leather or suede?',
          a: 'No, these require professional dry cleaning. Ask us about our Dry Cleaning coming soon!',
        },
        {
          q: 'Can you clean sports equipment (like gym gear)?',
          a: 'Yes! Add our Performance Wear Care (+$1.50/kg) for extra odor removal and sanitization.',
        },
        {
          q: 'What about wedding dresses or formal wear?',
          a: 'We recommend professional dry cleaning for valuable items. For everyday formal wear, use Delicate Care option.',
        },
        {
          q: 'Do you repair torn clothes?',
          a: 'Yes! Add Garment Repair ($5-$15 depending on damage). Simple tears and seams repaired by professionals.',
        },
      ],
    },
    {
      title: 'Account & Security',
      questions: [
        {
          q: 'Is my personal information safe?',
          a: 'Yes. We use bank-level encryption and never share your data with third parties.',
        },
        {
          q: 'Can I have multiple addresses?',
          a: 'Yes! Save up to 5 addresses for flexible scheduling across locations.',
        },
        {
          q: 'How do I reset my password?',
          a: 'Click "Forgot Password" on the login page. Reset link sent to your email instantly.',
        },
        {
          q: 'Can I delete my account?',
          a: 'Yes. Go to Settings → Account → Delete Account. Your data is permanently removed.',
        },
      ],
    },
  ]

  return (
    <>
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-mint to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <h1 className="text-5xl sm:text-6xl font-bold text-dark mb-6">Help & FAQ</h1>
          <p className="text-xl text-gray max-w-2xl">
            Find answers to common questions about Washlee. Can't find what you're looking for? We're here to help.
          </p>
        </div>
      </section>

      {/* FAQ Tabs */}
      <section className="section bg-white">
        <div className="space-y-12">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h2 className="text-3xl font-bold text-dark mb-6">{category.title}</h2>
              <div className="space-y-6">
                {category.questions.map((faq, qIndex) => {
                  const faqId = `${categoryIndex}-${qIndex}`
                  return (
                    <div
                      key={qIndex}
                      className="border-2 border-gray rounded-lg overflow-hidden hover:shadow-md transition"
                    >
                      <button
                        onClick={() => setOpenFaq(openFaq === faqId ? null : faqId)}
                        className="w-full flex items-center justify-between p-6 hover:bg-light transition text-left"
                      >
                        <span className="font-bold text-dark">{faq.q}</span>
                        <ChevronDown
                          size={20}
                          className={`text-primary transition flex-shrink-0 ${
                            openFaq === faqId ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {openFaq === faqId && (
                        <div className="px-6 py-6 text-gray border-t-2 border-gray">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust & Guarantee Banner */}
      <section className="bg-gradient-to-r from-primary/5 to-accent/5 border-2 border-primary/20 rounded-2xl p-8 mb-12">
        <h3 className="text-2xl font-bold text-dark mb-4">Your Satisfaction is Guaranteed</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-3xl font-bold text-primary mb-2">100%</div>
            <p className="text-dark font-semibold mb-1">Money-Back Guarantee</p>
            <p className="text-sm text-gray">30 days, no questions asked</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">0</div>
            <p className="text-dark font-semibold mb-1">Hidden Fees</p>
            <p className="text-sm text-gray">Transparent pricing always</p>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary mb-2">48 hrs</div>
            <p className="text-dark font-semibold mb-1">Issue Resolution</p>
            <p className="text-sm text-gray">Claims handled quickly</p>
          </div>
        </div>
      </section>
      <section className="section bg-light">
        <h2 className="text-4xl font-bold text-dark mb-12 text-center">Still Have Questions?</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl p-8 text-center">
            <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="font-bold text-lg text-dark mb-2">Email Support</h3>
            <p className="text-gray mb-4">Get help via email, usually within 2 hours</p>
            <a
              href="mailto:washlee@info.com"
              className="text-primary font-semibold hover:text-accent transition"
            >
              washlee@info.com
            </a>
          </div>

          <div className="bg-white rounded-xl p-8 text-center">
            <Phone className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="font-bold text-lg text-dark mb-2">Call Us</h3>
            <p className="text-gray mb-4">Speak with a representative Mon-Fri, 9am-5pm EST</p>
            <a
              href="tel:0412452133"
              className="text-primary font-semibold hover:text-accent transition"
            >
              0412-452-133
            </a>
          </div>

          <div className="bg-white rounded-xl p-8 text-center">
            <MessageSquare className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="font-bold text-lg text-dark mb-2">Live Chat</h3>
            <p className="text-gray mb-4">Available 24/7 in the app for quick questions</p>
            <button className="text-primary font-semibold hover:text-accent transition">
              Start Chat
            </button>
          </div>
        </div>

        {/* Contact Form */}
        <div className="max-w-2xl mx-auto bg-white rounded-xl p-8">
          <h3 className="text-2xl font-bold text-dark mb-6">Send us a Message</h3>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Your name"
                className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="email"
                placeholder="Your email"
                className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option>Select a topic</option>
              <option>Billing Question</option>
              <option>Report an Issue</option>
              <option>Feature Request</option>
              <option>Partnership</option>
              <option>Other</option>
            </select>
            <textarea
              placeholder="Tell us more..."
              rows={5}
              className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button size="lg" className="w-full">
              Send Message
            </Button>
          </form>
        </div>
      </section>

      <Footer />
    </>
  )
}
