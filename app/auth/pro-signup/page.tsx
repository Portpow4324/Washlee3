'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Link from 'next/link'
import { BookOpen, CheckCircle, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProSignupIntro() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-mint to-white py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl sm:text-6xl font-bold text-dark mb-6">
                Become a Washlee Pro Today
              </h1>
              <p className="text-xl text-gray mb-8">
                Earn flexible income providing professional laundry services in your community. Work when you want, make your own schedule.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => router.push('/auth/pro-signup-form')}>Get Started</Button>
                <button 
                  onClick={() => router.back()}
                  className="px-6 py-3 text-primary font-semibold hover:text-accent transition"
                >
                  ← Back
                </button>
              </div>
            </div>
            <div className="bg-accent rounded-2xl h-96 flex items-center justify-center text-6xl shadow-lg">
              💼
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Process */}
      <section className="py-20 sm:py-32 bg-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-dark mb-4 text-center">
            Get Started in 3 Easy Steps
          </h2>
          <p className="text-gray text-center mb-16 max-w-2xl mx-auto">
            The process is simple. Complete your application, get verified, and start earning.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition">
              <div className="bg-mint rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <BookOpen size={32} className="text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-dark mb-3">1</h3>
              <h4 className="text-xl font-bold text-dark mb-3">Sign up & Learn</h4>
              <p className="text-gray mb-4">
                Once you create an account you'll have access to our best practices videos and a 10 minute getting started guide.
              </p>
              <ul className="space-y-2 text-sm text-gray">
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
                  <span>Complete your profile</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
                  <span>Watch training videos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
                  <span>Review best practices</span>
                </li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition">
              <div className="bg-mint rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <TrendingUp size={32} className="text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-dark mb-3">2</h3>
              <h4 className="text-xl font-bold text-dark mb-3">Accept the Gigs You Want</h4>
              <p className="text-gray mb-4">
                We'll alert you to gigs in your area and guide you through your first order. It's always up to you when you work.
              </p>
              <ul className="space-y-2 text-sm text-gray">
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
                  <span>Receive order notifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
                  <span>Choose your own hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
                  <span>No mandatory scheduling</span>
                </li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition">
              <div className="bg-mint rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <CheckCircle size={32} className="text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-dark mb-3">3</h3>
              <h4 className="text-xl font-bold text-dark mb-3">Pick Up, Launder, Return</h4>
              <p className="text-gray mb-4">
                Start turning laundry piles into perfection (and cash). Wash, dry, fold, and return the next day.
              </p>
              <ul className="space-y-2 text-sm text-gray">
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
                  <span>Pick up from customers</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
                  <span>Professional washing service</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
                  <span>Timely delivery & payment</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20 sm:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-dark mb-4 text-center">
            Requirements
          </h2>
          <p className="text-gray text-center mb-12 max-w-2xl mx-auto">
            To become a Washlee Pro, you'll need to meet these requirements.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex gap-4">
              <CheckCircle size={24} className="text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-dark mb-2">18 Years or Older</h4>
                <p className="text-gray">Must be of legal age to work as an independent contractor.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle size={24} className="text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-dark mb-2">Valid ID & Background Check</h4>
                <p className="text-gray">We conduct ID verification and background screening for safety.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle size={24} className="text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-dark mb-2">Reliable Transportation</h4>
                <p className="text-gray">You'll need a vehicle for pickups and deliveries.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <CheckCircle size={24} className="text-primary flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-dark mb-2">Laundry Equipment</h4>
                <p className="text-gray">Access to washing machines, dryers, and folding space.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 bg-gradient-to-br from-mint to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-dark mb-6">
            Ready to Start Earning?
          </h2>
          <p className="text-xl text-gray mb-12 max-w-2xl mx-auto">
            Complete your application and join our growing community of Washlee Pros. Typical response time: 24-48 hours.
          </p>
          <Link href="/auth/pro-signup-form">
            <Button size="lg" className="text-lg">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
