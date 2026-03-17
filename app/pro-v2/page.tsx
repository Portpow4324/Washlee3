'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, TrendingUp, Clock, Star, Zap, DollarSign, Users } from 'lucide-react'
import { useState } from 'react'

export default function ProV2() {
  const [activeTab, setActiveTab] = useState<'overview' | 'earnings' | 'how'>('overview')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  return (
    <div>
      <Header />

      {/* Hero - Compact with Tab Navigation */}
      <section className="bg-gradient-to-br from-primary/10 via-mint to-accent/20 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-5xl sm:text-6xl font-bold text-dark mb-4">
              Join Washlee Pro
            </h1>
            <p className="text-xl text-gray mb-8 max-w-2xl mx-auto">
              Earn commission-based income on your own schedule. Accept orders, complete jobs, get paid weekly.
            </p>
            <Link href="/auth/signup?type=pro">
              <Button size="lg">Apply to Become a Pro</Button>
            </Link>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              { icon: Users, label: '500+ Pros', value: 'Earning Weekly' },
              { icon: DollarSign, label: '$70k+', value: 'Max Annual' },
              { icon: Star, label: '4.9★', value: 'Customer Rated' },
            ].map((stat, i) => {
              const Icon = stat.icon
              return (
                <div key={i} className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="font-bold text-dark">{stat.label}</p>
                  <p className="text-xs text-gray">{stat.value}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="bg-white sticky top-0 z-10 border-b border-gray/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4 sm:gap-8 justify-center">
            {[
              { id: 'overview', label: 'Why Join' },
              { id: 'earnings', label: 'Earnings' },
              { id: 'how', label: 'Get Started' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-4 font-semibold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray hover:text-dark'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Tab Content */}
      <section className="section bg-light">
        <div className="max-w-6xl mx-auto">
          {/* Tab 1: Why Join */}
          {activeTab === 'overview' && (
            <div className="space-y-12">
              {/* Two-column benefits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  {
                    icon: TrendingUp,
                    title: 'Earn Per Order',
                    description: 'Competitive commission on every completed order. Accept larger jobs for higher pay.',
                  },
                  {
                    icon: Clock,
                    title: 'Complete Flexibility',
                    description: 'Work when you want. Accept or decline any job with zero penalties.',
                  },
                  {
                    icon: Zap,
                    title: '100% Tips',
                    description: 'Keep every dollar customers tip. We only take commission on the service fee.',
                  },
                  {
                    icon: Star,
                    title: 'Build Your Reputation',
                    description: 'Your 5-star rating unlocks premium orders and higher payouts.',
                  },
                ].map((benefit, i) => {
                  const Icon = benefit.icon
                  return (
                    <div key={i} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-lg transition">
                      <Icon className="w-10 h-10 text-primary mb-4" />
                      <h3 className="text-xl font-bold text-dark mb-3">{benefit.title}</h3>
                      <p className="text-gray">{benefit.description}</p>
                    </div>
                  )
                })}
              </div>

              {/* Requirements inline */}
              <div className="bg-white rounded-xl p-8">
                <h3 className="text-2xl font-bold text-dark mb-6">What You Need</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    'Be 18+ years old',
                    'Valid driver\'s license & reliable vehicle',
                    'Pass background check (ABN verification)',
                    'Smartphone (iOS or Android)',
                    'Professional laundry handling',
                    'Provide your own transport',
                  ].map((req, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle className="text-primary flex-shrink-0 mt-0.5" size={20} />
                      <span className="text-dark">{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Earnings */}
          {activeTab === 'earnings' && (
            <div className="space-y-12">
              {/* Work cycle visual */}
              <div className="bg-white rounded-xl p-8">
                <h3 className="text-2xl font-bold text-dark mb-8 text-center">How You Earn</h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  {[
                    { icon: '📱', label: 'Accept\nOrder' },
                    { icon: '🚗', label: 'Pickup' },
                    { icon: '🧺', label: 'Wash &\nCare' },
                    { icon: '📦', label: 'Deliver' },
                    { icon: '💰', label: 'Get Paid' },
                  ].map((step, i) => (
                    <div key={i}>
                      <div className="text-center">
                        <div className="text-4xl mb-2">{step.icon}</div>
                        <p className="text-sm font-semibold text-dark whitespace-pre-line">{step.label}</p>
                      </div>
                      {i < 4 && <div className="hidden md:block text-2xl text-primary/30 text-center mt-4">→</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Earnings tiers - horizontal cards */}
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-dark">Sample Earnings</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      title: 'Casual',
                      orders: '8-12 orders/week',
                      earnings: '$280-400/week',
                      annual: '$15K-20K/year',
                      badge: 'Flexible',
                      color: 'bg-blue-50',
                    },
                    {
                      title: 'Regular Pro',
                      orders: '25-35 orders/week',
                      earnings: '$700-1,050/week',
                      annual: '$35K-52K/year',
                      badge: 'Most Popular',
                      color: 'bg-primary/10',
                      highlight: true,
                    },
                    {
                      title: 'Elite Earner',
                      orders: '40+ orders/week',
                      earnings: '$1,400+/week',
                      annual: '$70K+/year',
                      badge: 'Top 10%',
                      color: 'bg-purple-50',
                    },
                  ].map((tier, i) => (
                    <div
                      key={i}
                      className={`rounded-lg p-6 border-2 transition ${
                        tier.highlight
                          ? 'border-primary bg-accent/30 shadow-lg'
                          : 'border-gray/20 bg-white hover:border-primary'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xl font-bold text-dark">{tier.title}</h4>
                        <span className="text-xs font-bold bg-primary/20 text-primary px-3 py-1 rounded-full">
                          {tier.badge}
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray mb-1">Orders/Week</p>
                          <p className="text-lg font-bold text-dark">{tier.orders}</p>
                        </div>
                        <div className="bg-white/60 rounded p-3">
                          <p className="text-xs text-gray mb-1">Weekly Pay</p>
                          <p className="text-2xl font-bold text-primary">{tier.earnings}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray mb-1">Annual Potential</p>
                          <p className="text-lg font-bold text-dark">{tier.annual}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6">
                  <h4 className="font-bold text-dark mb-3">💳 Payment Structure</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-dark">Commission: $15-50+ per order</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-dark">Tips: 100% yours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-dark">Weekly payouts every Monday</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-white rounded-lg p-6">
                  <h4 className="font-bold text-dark mb-3">📊 What Affects Your Earnings</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Star size={16} className="text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-dark">Your rating (higher rating = premium jobs)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star size={16} className="text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-dark">Order size & complexity</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Star size={16} className="text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-dark">Your location & availability</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Get Started */}
          {activeTab === 'how' && (
            <div className="space-y-12">
              {/* Onboarding steps */}
              <div>
                <h3 className="text-2xl font-bold text-dark mb-8">Getting Started</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      number: 1,
                      title: 'Complete Your Application',
                      details: [
                        'Basic info (name, email, phone)',
                        'Location & vehicle details',
                        'ABN & tax information',
                      ],
                    },
                    {
                      number: 2,
                      title: 'Pass Background Check',
                      details: [
                        'Quick verification process',
                        'Background check required',
                        'Usually approved within 24-48 hours',
                      ],
                    },
                    {
                      number: 3,
                      title: 'Get Equipped',
                      details: [
                        'Download the Pro app',
                        'Add payment method',
                        'Set your availability',
                      ],
                    },
                    {
                      number: 4,
                      title: 'Start Accepting Jobs',
                      details: [
                        'Browse available orders',
                        'Accept jobs you want',
                        'Build your rating & earnings',
                      ],
                    },
                  ].map((step, i) => (
                    <div key={i} className="bg-white rounded-lg p-6 border-l-4 border-primary">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="bg-primary text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                          {step.number}
                        </div>
                        <h4 className="text-lg font-bold text-dark pt-1">{step.title}</h4>
                      </div>
                      <ul className="space-y-2 ml-14">
                        {step.details.map((detail, j) => (
                          <li key={j} className="text-sm text-gray flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick FAQ Accordion */}
              <div className="bg-white rounded-xl p-8">
                <h3 className="text-2xl font-bold text-dark mb-6">Common Questions</h3>
                <div className="space-y-3">
                  {[
                    {
                      q: 'Is there a cost to join?',
                      a: 'No! Completely free. You only need your own vehicle and smartphone.',
                    },
                    {
                      q: 'Do I need my own laundry equipment?',
                      a: 'No. We provide professional equipment at our facilities. You handle transport and service.',
                    },
                    {
                      q: 'Can I decline jobs?',
                      a: 'Yes, completely flexible. Decline any job with zero penalties or impact on your rating.',
                    },
                    {
                      q: 'What if my rating is low?',
                      a: 'You can improve it by providing excellent service. Higher ratings unlock premium, higher-paying orders.',
                    },
                  ].map((faq, i) => (
                    <div key={i} className="border border-gray/20 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                        className="w-full p-4 flex items-center justify-between hover:bg-light transition"
                      >
                        <h4 className="font-semibold text-dark text-left">{faq.q}</h4>
                        <span className={`text-primary transition-transform ${expandedFaq === i ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </button>
                      {expandedFaq === i && (
                        <div className="bg-light p-4 text-gray border-t border-gray/20">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-8 text-center">
                <h3 className="text-2xl font-bold text-white mb-3">Ready to Start Earning?</h3>
                <p className="text-white/90 mb-6">Apply now and start accepting orders within 48 hours.</p>
                <Link href="/auth/signup?type=pro">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90">
                    Apply to Become a Pro
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
