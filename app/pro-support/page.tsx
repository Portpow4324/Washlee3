'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { Smartphone, BookOpen, MessageSquare, DollarSign, Clock, Shield, MapPin, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function ProSupport() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const supportTopics = [
    {
      icon: Smartphone,
      title: "Pro App Guide",
      description: "Learn how to use the Pro app to accept jobs, manage your schedule, and track earnings.",
      articles: [
        "Getting Started with the Pro App",
        "Accepting and Managing Jobs",
        "Communication with Customers",
        "Navigation & Maps Integration",
      ]
    },
    {
      icon: DollarSign,
      title: "Earnings & Payouts",
      description: "Understand how you earn, view your balance, and manage your payouts.",
      articles: [
        "How Earnings Are Calculated",
        "View Your Earnings Report",
        "Payment Methods & Scheduling",
        "Tax Documents & 1099",
      ]
    },
    {
      icon: Shield,
      title: "Safety & Guidelines",
      description: "Important information to keep yourself and customers safe.",
      articles: [
        "Code of Conduct",
        "Safety Protocols",
        "Insurance & Coverage",
        "Customer Communication Best Practices",
      ]
    },
    {
      icon: Clock,
      title: "Scheduling & Availability",
      description: "Manage your work schedule and availability preferences.",
      articles: [
        "Setting Your Availability",
        "Block Out Time",
        "Time Zone & Location Settings",
        "Shift Planning",
      ]
    },
    {
      icon: MapPin,
      title: "Service Areas",
      description: "Information about service territories and where you can work.",
      articles: [
        "Available Service Areas",
        "Territory Management",
        "Expanding to New Areas",
        "Coverage & Delivery Options",
      ]
    },
    {
      icon: BookOpen,
      title: "Training & Resources",
      description: "Professional development materials and best practices.",
      articles: [
        "Laundry Care Training",
        "Customer Service Excellence",
        "Handling Special Items",
        "Quality Standards Checklist",
      ]
    },
  ]

  const proFaqs = [
    {
      question: "What are the requirements to become a Washlee Pro?",
      answer: "To be a Washlee Pro, you must be at least 18 years old, have a valid driver's license, pass a background check, and have reliable transportation. A smartphone with the Pro app is also required."
    },
    {
      question: "How much can I earn as a Washlee Pro?",
      answer: "Earnings vary based on order volume, distance traveled, and time of day. Most Pros earn $20-35 per hour, with flexibility to work as much or as little as they want. Top performers can earn significantly more."
    },
    {
      question: "What equipment do I need?",
      answer: "You'll need your own vehicle, smartphone, and internet connection. Washlee provides temperature-controlled laundry bags and pickup/delivery materials. We reimburse mileage and provide vehicle maintenance support."
    },
    {
      question: "How do I get paid?",
      answer: "You earn money for each completed job. Payouts are processed weekly via your chosen payment method (bank transfer, debit card, etc.). You can also cash out instantly through our app."
    },
    {
      question: "Do I need my own laundry facility?",
      answer: "No! We partner with commercial laundry facilities that Washlee Pros can use. You pick up laundry, bring it to a partner facility, and then deliver clean clothes to customers. It's that simple!"
    },
    {
      question: "Is insurance provided?",
      answer: "Yes! Washlee provides comprehensive coverage including customer liability insurance ($1M), cargo insurance for items in transit, and worker protection. You're covered while working."
    },
    {
      question: "Can I set my own hours?",
      answer: "Absolutely! Set your own schedule. Mark your availability in the app and accept jobs that work for you. Work full-time, part-time, or as a side gig—it's completely flexible."
    },
    {
      question: "What if there's a problem with a customer?",
      answer: "Our support team is available 24/7 to help resolve any issues with customers. We handle disputes professionally and always prioritize your safety and fair treatment."
    },
    {
      question: "How do ratings and reviews work?",
      answer: "Customers can rate you 1-5 stars and leave reviews. Maintaining a 4.5+ rating is important for staying active. Quality service, punctuality, and professionalism are key to good ratings."
    },
    {
      question: "Can I be deactivated?",
      answer: "Your account is active as long as you meet our quality standards and code of conduct. Ratings below 4.0, missed jobs, or policy violations can result in deactivation. We always give warnings and opportunities to improve first."
    },
  ]

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-mint to-white py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h1 className="text-5xl md:text-6xl font-bold text-dark mb-6">Washlee Pro Support</h1>
            <p className="text-xl text-gray max-w-2xl">
              Everything you need to succeed as a Washlee Pro. Find answers, resources, and support.
            </p>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="bg-primary text-white py-12 border-b border-primary">
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">$28</div>
                <p className="text-mint">Average Hourly Earnings</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">2K+</div>
                <p className="text-mint">Active Pros</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">24/7</div>
                <p className="text-mint">Support Available</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">100%</div>
                <p className="text-mint">Flexible Schedule</p>
              </div>
            </div>
          </div>
        </section>

        {/* Support Resources */}
        <section className="py-20 max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-dark mb-12">Support Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {supportTopics.map((topic, index) => {
              const Icon = topic.icon
              return (
                <Card key={index} className="p-8 hover:shadow-lg transition">
                  <Icon size={40} className="text-primary mb-4" />
                  <h3 className="text-xl font-bold text-dark mb-2">{topic.title}</h3>
                  <p className="text-gray mb-6 text-sm">{topic.description}</p>
                  <ul className="space-y-2 mb-6">
                    {topic.articles.map((article, i) => (
                      <li key={i} className="text-sm text-gray flex items-start gap-2">
                        <span className="text-primary font-bold">•</span>
                        {article}
                      </li>
                    ))}
                  </ul>
                  <Button size="sm" variant="outline">Learn More</Button>
                </Card>
              )
            })}
          </div>

          {/* Contact Support */}
          <div className="bg-primary text-white rounded-2xl p-12 mb-20">
            <h2 className="text-3xl font-bold mb-8 text-center">Pro Support Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="text-4xl mb-2">💬</div>
                <h3 className="font-bold mb-2">In-App Chat</h3>
                <p className="text-mint text-sm mb-4">Instant support within Pro app</p>
                <p className="text-sm">Available 24/7</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">📞</div>
                <h3 className="font-bold mb-2">Pro Hotline</h3>
                <p className="text-mint text-sm mb-4">Dedicated Pro support line</p>
                <p className="text-sm">+1 (800) 924-7544</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">📧</div>
                <h3 className="font-bold mb-2">Email Support</h3>
                <p className="text-mint text-sm mb-4">For detailed inquiries</p>
                <p className="text-sm">pro@washlee.com</p>
              </div>
            </div>
          </div>

          {/* Pro FAQs */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-dark mb-12 text-center">Pro FAQs</h2>
            <div className="space-y-4">
              {proFaqs.map((faq, index) => (
                <Card key={index} className="p-6">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full flex items-start justify-between gap-4"
                  >
                    <div className="text-left">
                      <h3 className="font-bold text-dark text-lg">{faq.question}</h3>
                    </div>
                    <AlertCircle
                      size={24}
                      className={`text-primary flex-shrink-0 transition ${
                        expandedFaq === index ? 'hidden' : ''
                      }`}
                    />
                  </button>
                  {expandedFaq === index && (
                    <p className="text-gray mt-4 leading-relaxed">{faq.answer}</p>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Performance Tips */}
          <Card className="p-12 bg-mint mb-20">
            <h2 className="text-3xl font-bold text-dark mb-8">Tips for Success</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-dark mb-3 flex items-center gap-2">
                  ⭐ Maintain High Ratings
                </h3>
                <p className="text-gray text-sm">
                  Professional service, punctuality, and great communication lead to excellent reviews. Aim for 4.5+ stars!
                </p>
              </div>
              <div>
                <h3 className="font-bold text-dark mb-3 flex items-center gap-2">
                  📱 Stay Online Often
                </h3>
                <p className="text-gray text-sm">
                  More availability means more job offers. Work peak hours when demand is highest.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-dark mb-3 flex items-center gap-2">
                  💼 Be Professional
                </h3>
                <p className="text-gray text-sm">
                  Reliable, courteous Pros get preferred customer matches and higher-paying jobs.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-dark mb-3 flex items-center gap-2">
                  🎯 Specialize
                </h3>
                <p className="text-gray text-sm">
                  Build expertise in delicate items or specific services to attract premium customers.
                </p>
              </div>
            </div>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-dark mb-6">Ready to Start Earning?</h2>
            <p className="text-gray mb-8 max-w-2xl mx-auto">
              Join thousands of Washlee Pros earning flexible income on their own schedule.
            </p>
            <Link href="/pro">
              <Button size="lg" className="text-white">Become a Washlee Pro</Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
