'use client'

import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Link from 'next/link'
import { ArrowRight, CheckCircle, Star, Calendar, Truck, Package, Apple, Play, Lock, Shield, MapPin, Zap, Gift, Leaf, CheckIcon } from 'lucide-react'

export default function Home() {
  return (
    <>
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-mint to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-dark mb-6 leading-tight tracking-tight">
                Reclaim Your Time.
                <br />
                <span className="text-primary">Laundry Done For You.</span>
              </h1>
              <p className="text-gray text-xl mb-8 max-w-md leading-relaxed font-medium">
                Fresh, clean clothes delivered to your door. We handle the washing, so you get back 1+ hours every week. Join 50,000+ busy professionals.
              </p>

              {/* Trust Signals */}
              <div className="flex flex-wrap gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">50K+</span>
                  <span className="text-sm text-gray">Happy Customers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">4.9★</span>
                  <span className="text-sm text-gray">Avg Rating</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-4 mb-8 text-xs text-gray">
                <div className="flex items-center gap-1.5">
                  <Lock size={16} className="text-primary" />
                  <span>SSL Encrypted</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle size={16} className="text-primary" />
                  <span>100% Money Back</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield size={16} className="text-primary" />
                  <span>Data Protected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-primary" />
                  <span>Nationwide Service</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/booking">
                  <Button size="lg" className="text-white font-bold text-lg">Schedule Your First Pickup</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="lg" variant="outline">Create Free Account</Button>
                </Link>
              </div>

              {/* App Store Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
                <a 
                  href="https://apps.apple.com/app/washlee" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-3 px-6 py-3 bg-dark text-white rounded-lg hover:shadow-lg transition font-semibold"
                >
                  <Apple size={24} />
                  Download on App Store
                </a>
                <a 
                  href="https://play.google.com/store/apps/details?id=com.washlee" 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-3 px-6 py-3 bg-dark text-white rounded-lg hover:shadow-lg transition font-semibold"
                >
                  <Play size={24} />
                  Get on Google Play
                </a>
              </div>
            </div>
            <div className="bg-accent rounded-2xl h-80 sm:h-96 overflow-hidden shadow-lg hover:shadow-2xl transition">
              <Image
                src="https://images.unsplash.com/photo-1635274605638-d44babc08a4f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                alt="Professional laundry and delivery service"
                width={500}
                height={400}
                loading="eager"
                className="w-full h-full object-cover w-auto h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section bg-white">
        <h2 className="section-title text-center">How It Works</h2>
        <p className="section-subtitle text-center max-w-2xl mx-auto">
          Four simple steps to get your laundry done
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              number: 1,
              title: 'Schedule a Pickup',
              description: 'Book through the Washlee app or website in seconds.',
              icon: Calendar,
            },
            {
              number: 2,
              title: 'We Pick It Up',
              description: 'A Washlee Pro collects your laundry at your door.',
              icon: Truck,
            },
            {
              number: 3,
              title: 'Washed & Folded',
              description: 'Washed, dried, folded, or hung just how you like it.',
              icon: Zap,
            },
            {
              number: 4,
              title: 'Delivered Back',
              description: 'Returned fresh—usually the very next day.',
              icon: Package,
            },
          ].map((step) => {
            const IconComponent = step.icon
            return (
              <div key={step.number} className="group cursor-pointer">
                <div className="bg-gradient-to-br from-primary to-accent rounded-2xl p-8 h-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-gradient-to-br hover:from-primary hover:to-accent">
                  <div className="flex justify-center mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                      <IconComponent size={40} className="text-white" />
                    </div>
                  </div>
                  <div className="inline-block bg-white bg-opacity-25 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold mb-4 mx-auto block">
                    {step.number}
                  </div>
                  <h3 className="font-bold text-lg text-white mb-3 text-center">{step.title}</h3>
                  <p className="text-white/90 text-sm text-center">{step.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <Link href="/how-it-works">
            <Button variant="outline">Learn More</Button>
          </Link>
        </div>
      </section>

      {/* Why Washlee - Competitive Differentiation */}
      <section className="section bg-light">
        <h2 className="section-title text-center">Why Choose Washlee Over Competitors?</h2>
        <p className="section-subtitle text-center max-w-2xl mx-auto">
          Here's what makes us different
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[
            {
              title: '1-Hour Pickup Confirmation',
              description: 'Get a confirmation within 1 hour (competitors take 24-48 hours).',
              icon: Zap,
            },
            {
              title: 'Lowest Minimum Order',
              description: 'Start with just $15, not $25-$40 like other services.',
              icon: Truck,
            },
            {
              title: 'First Pickup FREE',
              description: 'No hidden charges on your first order. Others charge $5-$10.',
              icon: Gift,
            },
            {
              title: 'Eco-Friendly by Default',
              description: 'We use sustainable, hypoallergenic detergents standard—no upcharge.',
              icon: Leaf,
            },
            {
              title: '4.9★ Rating (Highest)',
              description: 'Consistently higher rated than Poppins (4.7★) and Rinse (4.6★).',
              icon: Star,
            },
            {
              title: '100% Money-Back Guarantee',
              description: '30-day satisfaction guarantee, no questions asked. Period.',
              icon: CheckCircle,
            },
          ].map((benefit, i) => {
            const IconComponent = benefit.icon
            return (
            <Card key={i} hoverable>
              <div className="flex gap-4">
                <IconComponent size={40} className="text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-dark mb-2">{benefit.title}</h3>
                  <p className="text-gray text-sm">{benefit.description}</p>
                </div>
              </div>
            </Card>
            )
          })}
        </div>

        {/* Sustainability Message */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/30 rounded-2xl p-8 text-center mb-12">
          <h3 className="text-2xl font-bold text-dark mb-3">Our Commitment to Sustainability</h3>
          <p className="text-gray mb-6 max-w-2xl mx-auto">
            Every Washlee wash saves water and energy compared to doing it at home. Your annual laundry load reduces residential water usage by approximately 15,000 liters and has a carbon offset equivalent to planting 2 trees.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div>
              <span className="font-bold text-primary text-lg">40%</span>
              <span className="text-gray"> Less Water</span>
            </div>
            <div>
              <span className="font-bold text-primary text-lg">60%</span>
              <span className="text-gray"> Lower Energy</span>
            </div>
            <div>
              <span className="font-bold text-primary text-lg">2 Trees</span>
              <span className="text-gray"> Carbon Offset/Year</span>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Pricing Section */}
      <section className="section bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-5xl font-bold text-dark mb-6">Simple, Transparent Pricing</h2>
              <p className="text-xl text-gray mb-4 leading-relaxed">
                No hidden fees. No surprises. Just clean laundry at a fair price.
              </p>
              
              {/* Value Proposition */}
              <div className="bg-mint/50 rounded-lg p-4 mb-6 text-sm text-dark">
                <p className="font-semibold mb-2 flex items-center gap-2"><CheckCircle size={18} className="text-primary" /> How we compare:</p>
                <p className="mb-3"><span className="font-bold">$3.00/kg</span> = $15 for your average weekly load</p>
                <p className="mb-3"><span className="font-bold">LESS than 1 hour</span> of your hourly salary (for most professionals)</p>
                <p><span className="font-bold">Your time</span> is worth way more than that</p>
              </div>

              <Link href="/pricing">
                <Button size="lg" className="bg-primary text-white">
                  View Full Pricing & Add-ons
                </Button>
              </Link>
            </div>
            <div className="rounded-2xl h-96 overflow-hidden shadow-lg hover:shadow-2xl transition">
              <Image
                src="https://images.unsplash.com/photo-1604176354204-9268737828e4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwxfHxmb2xkZWQlMjBjbG90aGVzfGVufDB8fHx8MTc2ODcxMTc5M3ww&ixlib=rb-4.1.0&q=85"
                alt="Folded clothes"
                width={500}
                height={400}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section bg-gradient-to-br from-white via-mint/20 to-white">
        <h2 className="section-title text-center text-5xl">Loved by 50K+ Customers</h2>
        <p className="section-subtitle text-center max-w-2xl mx-auto text-lg">
          See why thousands of busy professionals choose Washlee
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: 'Sarah M.',
              role: 'Marketing Manager',
              quote: 'Washlee saved me hours every week. I can focus on what matters most.',
              rating: 5,
              image: 'https://i.imgur.com/ONbX32L.jpg',
            },
            {
              name: 'James R.',
              role: 'Software Engineer',
              quote: 'The app is so easy to use and my clothes always come back perfectly folded.',
              rating: 5,
              image: 'https://i.imgur.com/EppI7DS.jpg',
            },
            {
              name: 'Emily T.',
              role: 'Business Owner',
              quote: 'Best service I\'ve used all year. The quality is exceptional!',
              rating: 5,
              image: 'https://i.imgur.com/w4im5hy.jpg',
            },
          ].map((testimonial, i) => (
            <div key={i}>
              <Card hoverable>
                <div className="mb-4">
                  <div>
                    <p className="font-bold text-dark text-lg">{testimonial.name}</p>
                    <p className="text-sm text-gray mb-3">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star key={j} size={16} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray italic">"{testimonial.quote}"</p>
              </Card>
              <div className="mt-4 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition h-64">
                <Image
                  src={testimonial.image}
                  alt={testimonial.name}
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary via-accent to-primary py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white mb-10 opacity-100 max-w-2xl mx-auto font-semibold">
            Schedule Your First Pickup
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link href="/booking">
              <Button size="lg" className="bg-primary text-white font-bold hover:shadow-2xl">
                Schedule Your First Pickup
              </Button>
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-4 text-white text-sm font-semibold">
            <span className="flex items-center gap-1"><CheckCircle size={16} /> 4.9★ rated</span>
            <span className="flex items-center gap-1"><CheckCircle size={16} /> Cancel anytime</span>
            <span className="flex items-center gap-1"><CheckCircle size={16} /> No card required</span>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}