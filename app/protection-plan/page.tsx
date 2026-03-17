'use client'

import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { CheckCircle, Shield, Users, Zap, AlertCircle } from 'lucide-react'

export default function ProtectionPlan() {
  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        {/* Hero Section */}
        <section className="max-w-4xl mx-auto px-6 mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-dark mb-6">You're Protected with Washlee</h1>
          <p className="text-xl text-gray mb-6">
            Your safety and peace of mind are our top priorities. We take extensive measures to ensure that every laundry experience with Washlee is secure, professional, and protected.
          </p>
        </section>

        {/* Trust & Safety Section */}
        <section className="max-w-4xl mx-auto px-6 mb-16">
          <h2 className="text-3xl font-bold text-dark mb-8">Verified and Vetted Laundry Pros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <Shield className="text-primary flex-shrink-0" size={32} />
                <div>
                  <h3 className="font-bold text-dark mb-2">ID Verified</h3>
                  <p className="text-sm text-gray">Every Laundry Pro is required to verify their identity using a secure system that cross-references government-issued ID, personal data, and more.</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <Shield className="text-primary flex-shrink-0" size={32} />
                <div>
                  <h3 className="font-bold text-dark mb-2">Background Cleared</h3>
                  <p className="text-sm text-gray">We perform comprehensive background checks to ensure each Laundry Pro has a clean, law-abiding history.</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <Zap className="text-primary flex-shrink-0" size={32} />
                <div>
                  <h3 className="font-bold text-dark mb-2">AI-Screened</h3>
                  <p className="text-sm text-gray">Our proprietary AI analyzes billions of data points to detect and block bad actors—before they ever join the platform.</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <Users className="text-primary flex-shrink-0" size={32} />
                <div>
                  <h3 className="font-bold text-dark mb-2">Performance-Based Ranking</h3>
                  <p className="text-sm text-gray">Our algorithm continually ranks Laundry Pros using dozens of performance metrics. Top-ranked Pros receive more jobs.</p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Protection Plan Section */}
        <section className="bg-white py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-dark mb-8">The Washlee Protection Plan</h2>
            <p className="text-lg text-gray mb-12">
              In the rare event of loss or damage, you're backed by the Washlee Protection Plan, which offers up to $1,000 in coverage. Most customers never need it—but it's there for peace of mind.
            </p>

            {/* Coverage Tiers */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="p-8 border-2 border-gray">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-dark">Basic</h3>
                  <p className="text-sm text-gray">Included with every order</p>
                </div>
                <div className="mb-6 p-4 bg-mint rounded-lg">
                  <p className="text-3xl font-bold text-primary">FREE</p>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={20} className="text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-dark">Up to $50/garment</p>
                      <p className="text-gray">Maximum $300/order</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-8 border-2 border-primary">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-dark">Premium</h3>
                  <p className="text-sm text-gray">Enhanced protection</p>
                </div>
                <div className="mb-6 p-4 bg-mint rounded-lg">
                  <p className="text-3xl font-bold text-primary">$2.50</p>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={20} className="text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-dark">Up to $100/garment</p>
                      <p className="text-gray">Maximum $500/order</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-8 border-2 border-primary bg-mint/20">
                <div className="mb-4">
                  <h3 className="text-2xl font-bold text-dark">Premium+</h3>
                  <p className="text-sm text-gray">Maximum protection</p>
                </div>
                <div className="mb-6 p-4 bg-mint rounded-lg">
                  <p className="text-3xl font-bold text-primary">$5.75</p>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle size={20} className="text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-dark">Up to $150/garment</p>
                      <p className="text-gray">Maximum $1,000/order</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Laundry Process Section */}
        <section className="max-w-4xl mx-auto px-6 mb-16">
          <h2 className="text-3xl font-bold text-dark mb-8">Our Laundry Process = Yours at Home</h2>
          <p className="text-lg text-gray mb-8">
            We treat your laundry with the same care you would at home:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="text-primary flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold text-dark mb-2">Cold Wash by Default</h3>
                  <p className="text-sm text-gray">Unless you request otherwise, we use gentle cold water washing to protect your fabrics.</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="text-primary flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold text-dark mb-2">Color Separation</h3>
                  <p className="text-sm text-gray">Whites and colors, lights and darks are washed separately to prevent color bleeding.</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="text-primary flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold text-dark mb-2">Temperature Control</h3>
                  <p className="text-sm text-gray">Medium heat drying, low-heat drying, or hang-dry based on your fabric preferences.</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="text-primary flex-shrink-0" size={24} />
                <div>
                  <h3 className="font-bold text-dark mb-2">Order Separation</h3>
                  <p className="text-sm text-gray">Your order is tagged upon pickup and kept separate from other orders during the entire process.</p>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Reimbursement Section */}
        <section className="bg-white py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-dark mb-8">How We Handle Reimbursements</h2>
            
            <Card className="p-8 mb-8 border-l-4 border-primary">
              <p className="text-lg text-gray mb-6">
                In accordance with your chosen Washlee Protection Plan, we offer flexible reimbursement options to make things right if an item is lost or damaged during service.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">1</div>
                  <div>
                    <h4 className="font-bold text-dark mb-2">100% Reimbursement Option</h4>
                    <p className="text-gray">You can get up to 100% of the retail cost reimbursed (up to your coverage amount) if you choose to repurchase the item and meet our claim requirements.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">2</div>
                  <div>
                    <h4 className="font-bold text-dark mb-2">Account Credit Option</h4>
                    <p className="text-gray">We can issue Washlee account credit up to 100% of the item's new value (if a purchase receipt is provided), or up to 70% of its value without one.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">3</div>
                  <div>
                    <h4 className="font-bold text-dark mb-2">14-Day Claim Window</h4>
                    <p className="text-gray">To be eligible for reimbursement, please submit your claim within 14 days of delivery and follow the steps outlined in our Help Center policies.</p>
                  </div>
                </div>
              </div>
            </Card>

            <p className="text-gray mb-8">
              All claims are reviewed carefully, and final decisions are made by the Washlee team. Our goal is always to make things right — and we're here to help every step of the way.
            </p>
          </div>
        </section>

        {/* Summary Section */}
        <section className="max-w-4xl mx-auto px-6 mb-16">
          <Card className="p-8 bg-mint">
            <h2 className="text-2xl font-bold text-dark mb-4">In Summary</h2>
            <p className="text-dark text-lg">
              Washlee is built to be safe, dependable, and customer-focused. We combine people, technology, and clear policies to ensure you always feel confident placing an order. If something does go wrong, we've got your back—with real protection and responsive support.
            </p>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="max-w-4xl mx-auto px-6 mb-16 text-center">
          <h2 className="text-3xl font-bold text-dark mb-4">Ready to Try Washlee?</h2>
          <p className="text-gray mb-8">Start your first order with peace of mind. Protected every step of the way.</p>
          <Link href="/booking-hybrid">
            <Button size="lg">Book Your First Order</Button>
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  )
}
