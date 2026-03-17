'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Download, Smartphone, Zap, MapPin, Clock, Shield } from 'lucide-react'

export default function MobileAppPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-white py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Smartphone className="mx-auto mb-6" size={64} />
            <h1 className="text-5xl font-bold mb-4">Washlee Mobile App</h1>
            <p className="text-xl text-primary-light mb-8">Manage your laundry on the go. Book, track, and relax.</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <a
                href="https://apps.apple.com"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-lg hover:bg-gray-100 transition font-semibold"
              >
                <Download size={20} />
                App Store
              </a>
              <a
                href="https://play.google.com"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-lg hover:bg-gray-100 transition font-semibold"
              >
                <Download size={20} />
                Google Play
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto py-12 px-4">
          {/* Key Features */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Why Get the App?</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Real-time Tracking */}
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-start gap-4">
                  <MapPin className="text-primary flex-shrink-0" size={32} />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Real-time Tracking</h3>
                    <p className="text-gray-600">
                      Know exactly where your laundry is at every step. Get notifications when we're on the way.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Booking */}
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-start gap-4">
                  <Zap className="text-primary flex-shrink-0" size={32} />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Quick Booking</h3>
                    <p className="text-gray-600">
                      Book a pickup in seconds. Schedule recurring orders or book on demand, your choice.
                    </p>
                  </div>
                </div>
              </div>

              {/* Push Notifications */}
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-start gap-4">
                  <Clock className="text-primary flex-shrink-0" size={32} />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Notifications</h3>
                    <p className="text-gray-600">
                      Get reminders for scheduled pickups and instant updates when your laundry is ready.
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment */}
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="flex items-start gap-4">
                  <Shield className="text-primary flex-shrink-0" size={32} />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Payments</h3>
                    <p className="text-gray-600">
                      Save multiple payment methods. Fast, secure checkout with no hidden fees.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Screenshots Section */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">App Features</h2>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="bg-gray-100 rounded-lg h-48 mb-4 flex items-center justify-center">
                    <div className="text-center">
                      <Smartphone className="mx-auto text-gray-400 mb-2" size={48} />
                      <p className="text-gray-500 text-sm">Booking Screen</p>
                    </div>
                  </div>
                  <h4 className="font-bold text-gray-900">Easy Booking</h4>
                  <p className="text-gray-600 text-sm mt-2">Schedule pickups with just a few taps</p>
                </div>

                <div>
                  <div className="bg-gray-100 rounded-lg h-48 mb-4 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="mx-auto text-gray-400 mb-2" size={48} />
                      <p className="text-gray-500 text-sm">Tracking Screen</p>
                    </div>
                  </div>
                  <h4 className="font-bold text-gray-900">Live Tracking</h4>
                  <p className="text-gray-600 text-sm mt-2">Follow your laundry in real-time</p>
                </div>

                <div>
                  <div className="bg-gray-100 rounded-lg h-48 mb-4 flex items-center justify-center">
                    <div className="text-center">
                      <Zap className="mx-auto text-gray-400 mb-2" size={48} />
                      <p className="text-gray-500 text-sm">Account Screen</p>
                    </div>
                  </div>
                  <h4 className="font-bold text-gray-900">Manage Account</h4>
                  <p className="text-gray-600 text-sm mt-2">View history, payments, and settings</p>
                </div>
              </div>
            </div>
          </section>

          {/* Download CTA */}
          <section className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg shadow-lg p-12 text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Simplify Your Laundry?</h2>
            <p className="text-primary-light text-lg mb-8">Download the Washlee app and get $5 off your first order</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <a
                href="https://apps.apple.com"
                className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary rounded-lg hover:bg-gray-100 transition font-semibold"
              >
                <Download size={20} />
                Download on App Store
              </a>
              <a
                href="https://play.google.com"
                className="inline-flex items-center gap-2 px-8 py-3 border-2 border-white text-white rounded-lg hover:bg-white/10 transition font-semibold"
              >
                <Download size={20} />
                Get it on Google Play
              </a>
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <details className="bg-white rounded-lg shadow p-6 cursor-pointer">
                <summary className="font-bold text-gray-900 flex justify-between items-center">
                  Is the app free to download?
                  <span>+</span>
                </summary>
                <p className="text-gray-600 mt-4">
                  Yes! The Washlee app is completely free to download. You only pay for the laundry services you use.
                </p>
              </details>

              <details className="bg-white rounded-lg shadow p-6 cursor-pointer">
                <summary className="font-bold text-gray-900 flex justify-between items-center">
                  What devices does the app support?
                  <span>+</span>
                </summary>
                <p className="text-gray-600 mt-4">
                  The Washlee app is available on iOS (iPhone/iPad) and Android devices. Download from the App Store or Google Play.
                </p>
              </details>

              <details className="bg-white rounded-lg shadow p-6 cursor-pointer">
                <summary className="font-bold text-gray-900 flex justify-between items-center">
                  Can I use Washlee without the app?
                  <span>+</span>
                </summary>
                <p className="text-gray-600 mt-4">
                  Absolutely! You can book and manage your orders on our website at washlee.com.au. The app is just for convenience.
                </p>
              </details>

              <details className="bg-white rounded-lg shadow p-6 cursor-pointer">
                <summary className="font-bold text-gray-900 flex justify-between items-center">
                  How do I get the $5 first-order discount?
                  <span>+</span>
                </summary>
                <p className="text-gray-600 mt-4">
                  The discount is automatically applied when you download the app and create a new account. Use code APPFIRST5 at checkout.
                </p>
              </details>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  )
}
