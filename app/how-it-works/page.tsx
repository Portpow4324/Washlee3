'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Link from 'next/link'
import Image from 'next/image'

export default function HowItWorks() {
  return (
    <>
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-mint to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <h1 className="text-5xl sm:text-6xl font-bold text-dark mb-6">How Washlee Works</h1>
          <p className="text-xl text-gray max-w-2xl">
            Simple, straightforward steps to get your laundry picked up, cleaned, and delivered fresh to your door.
          </p>
        </div>
      </section>

      {/* Detailed Steps */}
      <section className="section bg-white">
        {/* Step 1 */}
        <div className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-2xl">1</div>
                <h2 className="text-4xl font-bold text-dark">Schedule a Pickup</h2>
              </div>
              <p className="text-gray text-lg mb-6">
                Download the Washly app or visit our website. Select your pickup time—as soon as 2 hours from now or schedule for later. Choose your preferences:
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-dark">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Detergent type (hypoallergenic, eco-friendly, or scented)</span>
                </li>
                <li className="flex items-start gap-3 text-dark">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Water temperature preferences</span>
                </li>
                <li className="flex items-start gap-3 text-dark">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Special care instructions for delicates</span>
                </li>
                <li className="flex items-start gap-3 text-dark">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Folding or hanging preferences</span>
                </li>
              </ul>
              <p className="text-gray text-lg mb-6">
                The whole process takes less than 2 minutes. You'll receive instant confirmation with your Washly Pro's details.
              </p>
            </div>
            <div className="rounded-2xl h-96 overflow-hidden shadow-lg hover:shadow-2xl transition">
              <Image
                src="https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzd8MHwxfHNlYXJjaHwyfHxsYXVuZHJ5JTIwc2VydmljZXxlbnwwfHx8fDE3Njg3MTE3ODd8MA&ixlib=rb-4.1.0&q=85"
                alt="Scheduling pickup on mobile app"
                width={500}
                height={400}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-2xl">2</div>
                <h2 className="text-4xl font-bold text-dark">We Pick It Up</h2>
              </div>
              <p className="text-gray text-lg mb-6">
                A trusted Washly Pro arrives at your scheduled time. No need to be home—many customers leave their laundry in a designated spot.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-dark">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Contactless pickup available</span>
                </li>
                <li className="flex items-start gap-3 text-dark">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Your laundry is weighed on-site</span>
                </li>
                <li className="flex items-start gap-3 text-dark">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Receive instant notification and pricing confirmation</span>
                </li>
                <li className="flex items-start gap-3 text-dark">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>All Washly Pros are background-checked and insured</span>
                </li>
              </ul>
              <p className="text-gray text-lg">
                Track your Washly Pro's arrival in real-time through the app, just like rideshare services.
              </p>
            </div>
            <div className="rounded-2xl h-96 overflow-hidden shadow-lg hover:shadow-2xl transition">
              <Image
                src="https://images.unsplash.com/photo-1567113463300-102a7eb3cb26?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwyfHxmb2xkZWQlMjBjbG90aGVzfGVufDB8fHx8MTc2ODcxMTc5M3ww&ixlib=rb-4.1.0&q=85"
                alt="Professional laundry pickup service"
                width={500}
                height={400}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="rounded-2xl h-96 overflow-hidden shadow-lg hover:shadow-2xl transition order-2 md:order-1">
              <Image
                src="https://images.unsplash.com/photo-1567113463300-102a7eb3cb26?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwyfHxmb2xkZWQlMjBjbG90aGVzfGVufDB8fHx8MTc2ODcxMTc5M3ww&ixlib=rb-4.1.0&q=85"
                alt="Professionally folded colorful laundry"
                width={500}
                height={400}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="order-1 md:order-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-2xl">3</div>
                <h2 className="text-4xl font-bold text-dark">Washed & Folded</h2>
              </div>
              <p className="text-gray text-lg mb-6">
                Your clothes are taken to our professional cleaning facility where they receive expert care:
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-dark">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Sorted by color and fabric type</span>
                </li>
                <li className="flex items-start gap-3 text-dark">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Washed with your chosen detergent and temperature</span>
                </li>
                <li className="flex items-start gap-3 text-dark">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Dried with care to prevent shrinkage</span>
                </li>
                <li className="flex items-start gap-3 text-dark">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Professionally folded or hung</span>
                </li>
                <li className="flex items-start gap-3 text-dark">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Quality checked before packaging</span>
                </li>
              </ul>
              <p className="text-gray text-lg">
                Delicates, business attire, and special items get individual attention from our trained staff.
              </p>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-primary text-white rounded-full w-16 h-16 flex items-center justify-center font-bold text-2xl">4</div>
                <h2 className="text-4xl font-bold text-dark">Delivered Back</h2>
              </div>
              <p className="text-gray text-lg mb-6">
                Fresh, clean laundry delivered right to your door, typically within 24 hours:
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-dark">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Next-day delivery included in standard pricing</span>
                </li>
                <li className="flex items-start gap-3 text-dark">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Same-day delivery available in select areas</span>
                </li>
                <li className="flex items-start gap-3 text-dark">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Get notified when your Pro is nearby</span>
                </li>
                <li className="flex items-start gap-3 text-dark">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Contactless delivery available</span>
                </li>
                <li className="flex items-start gap-3 text-dark">
                  <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span>Clothes returned neatly packaged and ready to put away</span>
                </li>
              </ul>
              <p className="text-gray text-lg">
                Not home? No problem. We'll leave your laundry in your designated spot, safely packaged.
              </p>
            </div>
            <div className="rounded-2xl h-96 overflow-hidden shadow-lg hover:shadow-2xl transition">
              <Image
                src="https://images.unsplash.com/photo-1641642231157-0849081598a2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwzfHxmb2xkZWQlMjBjbG90aGVzfGVufDB8fHx8MTc2ODcxMTc5M3ww&ixlib=rb-4.1.0&q=85"
                alt="Clean delivered laundry"
                width={500}
                height={400}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary to-accent py-16 sm:py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <Link href="/auth/signup">
            <Button size="lg" className="bg-white text-primary hover:bg-light">
              Schedule Your First Pickup
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </>
  )
}
