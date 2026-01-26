'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Link from 'next/link'
import { CheckCircle, TrendingUp, Clock, Star } from 'lucide-react'
import { useState } from 'react'

export default function BecomePro() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
  })
  const [activeCard, setActiveCard] = useState<number | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleCardClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveCard(activeCard === index ? null : index)
  }

  const handlePageClick = () => {
    setActiveCard(null)
  }

  return (
    <div onClick={handlePageClick}>
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-mint to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl sm:text-6xl font-bold text-dark mb-6">
                Earn Money Doing What You Love
              </h1>
              <p className="text-xl text-gray mb-8">
                Become a Washlee Pro and earn flexible income by providing professional laundry services to your community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/signup?type=pro">
                  <Button size="lg">Apply Now</Button>
                </Link>
                <a href="#learn-more" className="flex items-center gap-2 px-6 py-3 text-primary font-semibold">
                  Learn More ↓
                </a>
              </div>
            </div>
            <div className="bg-accent rounded-2xl h-96 flex items-center justify-center text-6xl">
              💼
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { number: '500+', label: 'Active Washlee Pros' },
            { number: '$25k', label: 'Average Annual Earnings' },
            { number: '4.9★', label: 'Customer Rating' },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-5xl font-bold text-primary mb-2">{stat.number}</p>
              <p className="text-gray text-lg">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Join */}
      <section className="section bg-light" id="learn-more">
        <h2 className="text-4xl font-bold text-dark mb-12 text-center">Why Join Washlee?</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {[
            {
              icon: TrendingUp,
              title: 'Earn More',
              description: 'Average Washlee Pros earn around $25k annually, with flexible scheduling.',
            },
            {
              icon: Clock,
              title: 'Flexible Schedule',
              description: 'Work the hours that fit your life. Accept or decline jobs as you please.',
            },
            {
              icon: Star,
              title: 'Build Your Rating',
              description: 'Earn 5-star ratings and grow your customer base for more opportunities.',
            },
            {
              icon: CheckCircle,
              title: 'Professional Support',
              description: 'Dedicated support team available 24/7 to help with any issues.',
            },
          ].map((benefit, i) => {
            const Icon = benefit.icon
            return (
              <Card key={i} hoverable>
                <Icon className="w-12 h-12 text-primary mb-4" />
                <h3 className="font-bold text-lg text-dark mb-3">{benefit.title}</h3>
                <p className="text-gray">{benefit.description}</p>
              </Card>
            )
          })}
        </div>
      </section>

      {/* How It Works for Pros */}
      <section className="section bg-white">
        <h2 className="text-4xl font-bold text-dark mb-12 text-center">How It Works for Washlee Pros</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            {
              number: 1,
              title: 'Apply',
              description: 'Complete the online application',
            },
            {
              number: 2,
              title: 'Get Approved',
              description: 'Quick background check & verification',
            },
            {
              number: 3,
              title: 'Get Equipped',
              description: 'Receive Washlee Pro starter kit',
            },
            {
              number: 4,
              title: 'Start Earning',
              description: 'Accept jobs and start making money',
            },
          ].map((step, i) => (
            <Card key={i} hoverable className="text-center">
              <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg mb-4 mx-auto">
                {step.number}
              </div>
              <h3 className="font-bold text-dark mb-2">{step.title}</h3>
              <p className="text-sm text-gray">{step.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Earnings */}
      <section className="section bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-500">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Sample Earnings</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            {
              title: 'Casual',
              hours: '8-12 hrs/week',
              earnings: '$280-400/week',
              annual: '$15K-20K/year',
              badge: 'Flexible',
            },
            {
              title: 'Regular Pro',
              hours: '25-35 hrs/week',
              earnings: '$700-1,050/week',
              annual: '$35K-52K/year',
              highlight: true,
              badge: 'Most Popular',
            },
            {
              title: 'Elite Earner',
              hours: '40+ hrs/week',
              earnings: '$1,400+/week',
              annual: '$70K+/year',
              badge: 'Top 10%',
            },
          ].map((tier, i) => (
            <div
              key={i}
              onClick={(e) => handleCardClick(i, e)}
              className={`rounded-xl p-8 relative transition-all duration-300 ease-in-out cursor-pointer hover:bg-white hover:text-dark hover:shadow-2xl ${
                activeCard === i
                  ? 'bg-white bg-opacity-30 text-dark shadow-2xl border-4 border-white scale-105'
                  : tier.highlight
                  ? 'bg-white bg-opacity-20 text-white shadow-xl scale-105 border-2 border-white border-opacity-40'
                  : 'bg-white bg-opacity-15 text-white backdrop-blur-sm'
              }`}
            >
              {tier.badge && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block ${
                  tier.highlight
                    ? 'bg-pink-400 text-white'
                    : 'bg-white bg-opacity-30 text-white'
                }`}>
                  {tier.badge}
                </span>
              )}
              <h3 className="text-2xl font-bold mb-4">{tier.title}</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm opacity-75 mb-1">Hours Per Week</p>
                  <p className="text-2xl font-bold">{tier.hours}</p>
                </div>
                <div>
                  <p className="text-sm opacity-75 mb-1">Weekly Earnings</p>
                  <p className="text-2xl font-bold">{tier.earnings}</p>
                </div>
                <div>
                  <p className="text-sm opacity-75 mb-1">Annual Potential</p>
                  <p className="text-3xl font-bold">{tier.annual}</p>
                </div>
              </div>
              <Link href="/auth/signup?type=pro" className="block">
                <Button size="lg" className={`w-full bg-primary text-white transition-all hover:bg-white hover:!text-dark`}>Apply Now</Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Requirements */}
      <section className="section bg-white">
        <h2 className="text-4xl font-bold text-dark mb-12 text-center">Requirements</h2>

        <div className="max-w-3xl mx-auto">
          <Card>
            <h3 className="text-2xl font-bold text-dark mb-6">Must Have</h3>
            <ul className="space-y-4">
              {[
                'Be 18+ years old',
                'Have a valid driver\'s license and vehicle',
                'Pass a background check',
                'Have a smartphone (iOS or Android)',
                'Be comfortable handling laundry professionally',
              ].map((req, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="text-primary mt-1 flex-shrink-0" size={20} />
                  <span className="text-dark">{req}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* Application Form */}
      <section className="section bg-light" id="apply">
        <h2 className="text-4xl font-bold text-dark mb-12 text-center">Apply to Become a Washlee Pro</h2>

        <div className="max-w-2xl mx-auto bg-white rounded-xl p-8">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="email"
                placeholder="Email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <input
              type="tel"
              placeholder="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <select
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select Your State</option>
              <option>New South Wales (NSW)</option>
              <option>Victoria (VIC)</option>
              <option>Queensland (QLD)</option>
              <option>Western Australia (WA)</option>
              <option>South Australia (SA)</option>
              <option>Tasmania (TAS)</option>
              <option>Australian Capital Territory (ACT)</option>
              <option>Northern Territory (NT)</option>
              <option>Other</option>
            </select>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="terms"
                className="w-4 h-4 rounded border-gray"
              />
              <label htmlFor="terms" className="text-sm text-gray">
                I agree to the Terms & Conditions and Privacy Policy
              </label>
            </div>

            <Button size="lg" className="w-full">
              Submit Application
            </Button>

            <p className="text-center text-sm text-gray">
              Typical response time: 24-48 hours
            </p>
          </form>
        </div>
      </section>

      {/* FAQ */}
      <section className="section bg-white">
        <h2 className="text-4xl font-bold text-dark mb-12 text-center">Pro FAQ</h2>

        <div className="max-w-2xl mx-auto space-y-4">
          {[
            {
              q: 'How much does it cost to join?',
              a: 'Free! There are no upfront fees to become a Washlee Pro. We provide everything you need.',
            },
            {
              q: 'Do I need my own laundry equipment?',
              a: 'No. We provide access to professional-grade equipment at our facilities. You just provide the transportation and service.',
            },
            {
              q: 'How often can I work?',
              a: 'Completely flexible. Accept the jobs you want, when you want. Work full-time, part-time, or on your own schedule.',
            },
            {
              q: 'How much can I earn per order?',
              a: 'Earnings vary by location and order size, typically $15-50 per pickup/delivery pair. Plus tips!',
            },
            {
              q: 'When do I get paid?',
              a: 'Payments are processed weekly via direct deposit every Monday for work completed the previous week.',
            },
          ].map((faq, i) => (
            <div key={i} className="border border-gray rounded-lg p-6">
              <h3 className="font-bold text-dark mb-2">{faq.q}</h3>
              <p className="text-gray">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}
