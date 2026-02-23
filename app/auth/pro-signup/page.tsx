'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Image from 'next/image'
import Link from 'next/link'
import { BookOpen, CheckCircle, TrendingUp, Clock, Star } from 'lucide-react'
import { useState } from 'react'

export default function ProSignup() {
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-mint to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl sm:text-6xl font-bold text-dark mb-6">
                Become a Washlee Pro Today
              </h1>
              <p className="text-xl text-gray mb-8">
                Earn flexible income providing professional laundry services in your community. Work when you want, make your own schedule.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/pro-signup-form">
                  <Button size="lg">Get Started</Button>
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

      {/* Sample Earnings */}
      <section className="section bg-light">
        <h2 className="text-4xl font-bold text-dark mb-12 text-center">Sample Earnings</h2>

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
              className={`rounded-xl p-8 relative transition-all duration-300 ease-in-out cursor-pointer border-2 ${
                activeCard === i
                  ? 'bg-white text-dark shadow-2xl border-primary scale-105'
                  : 'bg-white text-dark border-gray/20 hover:border-primary hover:shadow-lg'
              }`}
            >
              {tier.badge && (
                <span className="text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block bg-primary/10 text-primary">
                  {tier.badge}
                </span>
              )}
              <h3 className="text-2xl font-bold mb-4 text-dark">{tier.title}</h3>
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray mb-1">Hours Per Week</p>
                  <p className="text-2xl font-bold text-dark">{tier.hours}</p>
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
            </div>
          ))}
        </div>
      </section>

      {/* Requirements */}
      <section className="section bg-white">
        <h2 className="text-4xl font-bold text-dark mb-12 text-center">Requirements to Become a Pro</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {[
            {
              title: '18 Years or Older',
              description: 'Must be of legal age to work as an independent contractor.',
            },
            {
              title: 'Valid ID & Background Check',
              description: 'We conduct ID verification and background screening for safety.',
            },
            {
              title: 'Reliable Transportation',
              description: 'You\'ll need a vehicle for pickups and deliveries.',
            },
            {
              title: 'Laundry Equipment',
              description: 'Access to washing machines, dryers, and folding space.',
            },
            {
              title: 'Smartphone',
              description: 'iOS or Android device to receive orders and updates.',
            },
            {
              title: 'Professional Attitude',
              description: 'Be comfortable handling laundry professionally and maintaining quality.',
            },
          ].map((req, i) => (
            <div key={i} className="flex gap-4">
              <CheckCircle size={24} className="text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-dark mb-2">{req.title}</h4>
                <p className="text-gray">{req.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3-Step Process */}
      <section className="section bg-light">
        <h2 className="text-4xl font-bold text-dark mb-12 text-center">Get Started in 3 Easy Steps</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: BookOpen,
              number: '1',
              title: 'Sign up & Learn',
              description: 'Complete your profile and access our training materials.',
              items: [
                'Complete your profile',
                'Watch training videos',
                'Review best practices',
              ],
            },
            {
              icon: TrendingUp,
              number: '2',
              title: 'Accept the Gigs You Want',
              description: 'We\'ll alert you to gigs in your area and guide you through your first order.',
              items: [
                'Receive order notifications',
                'Choose your own hours',
                'No mandatory scheduling',
              ],
            },
            {
              icon: CheckCircle,
              number: '3',
              title: 'Pick Up, Launder, Return',
              description: 'Start turning laundry piles into perfection and cash.',
              items: [
                'Pick up from customers',
                'Professional washing service',
                'Timely delivery & payment',
              ],
            },
          ].map((step, i) => (
            <Card key={i} hoverable>
              <div className="bg-mint rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <step.icon size={32} className="text-primary" />
              </div>
              <h3 className="text-xl font-bold text-dark mb-2">{step.title}</h3>
              <p className="text-gray mb-4 text-sm">{step.description}</p>
              <ul className="space-y-2 text-sm text-gray">
                {step.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
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
