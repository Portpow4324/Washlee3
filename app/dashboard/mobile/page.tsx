'use client'

import Card from '@/components/Card'
import Button from '@/components/Button'
import { Smartphone, Apple, Play, Download } from 'lucide-react'

export default function MobileApp() {
  return (
    <div className="space-y-8">
      {/* App Overview */}
      <div>
        <h2 className="text-2xl font-bold text-dark mb-6">Washlee Mobile App</h2>
        <Card className="bg-gradient-to-r from-primary/10 to-mint/10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-dark mb-3">Laundry on the Go</h3>
              <p className="text-gray mb-6">
                Get the full Washlee experience in your pocket. Place orders, track pickups and deliveries, manage subscriptions, and more—all from your phone.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button className="flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-black/90 transition">
                  <Apple size={20} />
                  App Store
                </button>
                <button className="flex items-center justify-center gap-2 px-6 py-3 bg-[#3ddc84] text-white rounded-lg font-semibold hover:bg-[#3ddc84]/90 transition">
                  <Play size={20} />
                  Google Play
                </button>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-32 h-64 bg-gradient-to-b from-primary to-mint rounded-3xl shadow-lg flex items-center justify-center">
                <Smartphone size={64} className="text-white" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Features */}
      <div>
        <h2 className="text-2xl font-bold text-dark mb-6">App Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: 'Quick Ordering',
              description: 'Schedule pickups in seconds with saved preferences and addresses.',
            },
            {
              title: 'Real-time Tracking',
              description: 'See exactly where your laundry is with live GPS tracking.',
            },
            {
              title: 'Push Notifications',
              description: 'Get instant alerts for pickups, deliveries, and order updates.',
            },
            {
              title: 'One-Tap Reorders',
              description: 'Quickly repeat your favorite orders with all settings saved.',
            },
            {
              title: 'Digital Receipts',
              description: 'All invoices and receipts saved in the app for easy access.',
            },
            {
              title: 'Chat Support',
              description: 'Message support directly from the app for faster help.',
            },
          ].map((feature, i) => (
            <Card key={i} hoverable>
              <h3 className="font-bold text-dark mb-2">{feature.title}</h3>
              <p className="text-gray text-sm">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* System Requirements */}
      <div>
        <h2 className="text-2xl font-bold text-dark mb-6">System Requirements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                <Apple size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-dark mb-1">iOS</h3>
                <p className="text-gray text-sm">iOS 13 or later</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray">
              <li>• Compatible with iPhone 8 and later</li>
              <li>• Requires 50 MB storage space</li>
              <li>• Internet connection required</li>
              <li>• Location access recommended</li>
            </ul>
          </Card>

          <Card>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-[#3ddc84] rounded-lg flex items-center justify-center flex-shrink-0">
                <Play size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-dark mb-1">Android</h3>
                <p className="text-gray text-sm">Android 8 or later</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray">
              <li>• Compatible with most modern devices</li>
              <li>• Requires 45 MB storage space</li>
              <li>• Internet connection required</li>
              <li>• Location access recommended</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Screenshots */}
      <div>
        <h2 className="text-2xl font-bold text-dark mb-6">App Screenshots</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: 'Dashboard', desc: 'See all your orders at a glance' },
            { title: 'Booking', desc: 'Quick and easy order placement' },
            { title: 'Tracking', desc: 'Real-time delivery tracking' },
            { title: 'Receipts', desc: 'Digital invoices and history' },
          ].map((item, i) => (
            <Card key={i} className="aspect-square flex flex-col items-center justify-center bg-gradient-to-b from-mint/20 to-primary/10">
              <div className="text-4xl font-bold text-primary/30 mb-2">📱</div>
              <h3 className="font-semibold text-dark text-center text-sm">{item.title}</h3>
              <p className="text-gray text-xs text-center mt-2">{item.desc}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-2xl font-bold text-dark mb-6">App FAQ</h2>
        <div className="space-y-4">
          {[
            {
              q: 'Is the app free?',
              a: 'Yes! The Washlee app is completely free to download. You only pay for your laundry orders.',
            },
            {
              q: 'Can I use the web version and app at the same time?',
              a: 'Absolutely! Your account syncs across all devices. Orders placed on web appear in the app instantly.',
            },
            {
              q: 'Does the app work offline?',
              a: 'You need an internet connection to place orders and track deliveries. Historical data displays when offline.',
            },
            {
              q: 'How much data does the app use?',
              a: 'Normal usage with tracking and notifications uses about 10-20 MB per month. Rates depend on your usage.',
            },
            {
              q: 'Can I disable notifications?',
              a: 'Yes, go to Settings > Notifications to customize which updates you receive and how.',
            },
          ].map((faq, i) => (
            <Card key={i}>
              <h3 className="font-bold text-dark mb-2">{faq.q}</h3>
              <p className="text-gray text-sm">{faq.a}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
