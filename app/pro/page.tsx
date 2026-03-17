'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Link from 'next/link'
import Image from 'next/image'
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
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup?type=pro" onClick={(e) => e.stopPropagation()}>
                  <Button size="lg">Apply Now</Button>
                </Link>
                <a href="#learn-more" className="flex items-center justify-center gap-2 px-6 py-3 text-primary font-semibold">
                  Learn More ↓
                </a>
              </div>
            </div>
            <div className="rounded-2xl h-96 overflow-hidden shadow-lg">
              <Image
                src="/pro-hero.jpg"
                alt="Washlee Pro"
                width={500}
                height={400}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section bg-white">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { number: '500+', label: 'Pros Earning This Week' },
            { number: '$70k+', label: 'Highest Annual Earnings' },
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
              title: 'Earn Per Order',
              description: 'Get paid for every order you complete. Accept jobs that match your earning goals—earn more by doing more.',
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
              title: 'Accept Order',
              description: 'Browse available orders in your area and accept jobs that fit your schedule',
            },
            {
              number: 2,
              title: 'Pickup',
              description: 'Collect laundry from customer location',
            },
            {
              number: 3,
              title: 'Wash & Care',
              description: 'Professional laundry handling with quality assurance',
            },
            {
              number: 4,
              title: 'Deliver & Get Paid',
              description: 'Return clean laundry and earn your commission plus 100% of tips',
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
      <section className="section bg-light">
        <h2 className="text-4xl font-bold text-dark mb-12 text-center">Sample Earnings</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            {
              title: 'Casual',
              orders: '8-12 orders/week',
              earnings: '$280-400/week',
              annual: '$15K-20K/year',
              badge: 'Flexible',
            },
            {
              title: 'Regular Pro',
              orders: '25-35 orders/week',
              earnings: '$700-1,050/week',
              annual: '$35K-52K/year',
              highlight: true,
              badge: 'Most Popular',
            },
            {
              title: 'Elite Earner',
              orders: '40+ orders/week',
              earnings: '$1,400+/week',
              annual: '$70K+/year',
              badge: 'Top 10%',
            },
          ].map((tier, i) => (
            <div
              key={i}
              onClick={(e) => handleCardClick(i, e)}
              className={`rounded-xl p-8 relative transition-all duration-300 ease-in-out cursor-pointer border-2 ${
                activeCard === i
                  ? 'bg-white text-dark shadow-2xl border-primary scale-105'
                  : tier.highlight
                  ? 'bg-accent text-dark shadow-lg border-primary scale-105'
                  : 'bg-white text-dark border-gray/20 hover:border-primary hover:shadow-lg'
              }`}
            >
              {tier.badge && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block ${
                  tier.highlight
                    ? 'bg-primary text-white'
                    : 'bg-primary/10 text-primary'
                }`}>
                  {tier.badge}
                </span>
              )}
              <h3 className="text-2xl font-bold mb-4 text-dark">{tier.title}</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray mb-1">Orders Per Week</p>
                  <p className="text-2xl font-bold text-dark">{tier.orders}</p>
                </div>
                <div>
                  <p className="text-sm text-gray mb-1">Weekly Earnings</p>
                  <p className="text-2xl font-bold text-primary">{tier.earnings}</p>
                </div>
                <div>
                  <p className="text-sm text-gray mb-1">Annual Potential</p>
                  <p className="text-3xl font-bold text-dark">{tier.annual}</p>
                </div>
              </div>
              <Link href="/auth/signup?type=pro" className="block" onClick={(e) => e.stopPropagation()}>
                <Button size="lg" className={`w-full`}>Apply Now</Button>
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
                'Have a valid driver\'s license and reliable vehicle',
                'Pass a background check (ABN verification)',
                'Have a smartphone (iOS or Android)',
                'Be comfortable handling laundry professionally',
                'Provide your own transport (vehicle fuel/maintenance)',
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

      {/* FAQ */}
      <section className="section bg-white">
        <h2 className="text-4xl font-bold text-dark mb-12 text-center">Pro FAQ</h2>

        <div className="max-w-2xl mx-auto space-y-4">
          {[
            {
              q: 'How much does it cost to join?',
              a: 'Free! There are no upfront fees to become a Washlee Pro. You\'ll need your own vehicle and smartphone to get started.',
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
              a: 'You earn a commission per completed order ($15-50+ depending on location, order size, and complexity) plus 100% of customer tips. Larger or specialty orders pay more.',
            },
            {
              q: 'When do I get paid?',
              a: 'Payments are processed weekly via direct deposit every Monday for work completed the previous week.',
            },
            {
              q: 'Will I receive tax documentation?',
              a: 'As an independent contractor, you\'ll receive annual income statements for tax purposes. Keep records of your earnings for your records.',
            },
            {
              q: 'What if I decline an order?',
              a: 'No penalties! You can accept or decline any order. Your acceptance rate doesn\'t affect your ability to get future orders.',
            },
            {
              q: 'How is my rating calculated?',
              a: 'Ratings are based on customer reviews, on-time delivery, and professional service. Your rating helps you qualify for better-paying orders.',
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
