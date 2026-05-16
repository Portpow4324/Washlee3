'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Mail, MapPin } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-dark text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <Image
                src="/logo-washlee.png"
                alt="Washlee"
                width={48}
                height={32}
                className="rounded-full object-cover"
                style={{ width: '48px', height: 'auto' }}
                priority
              />
              <span className="font-bold text-xl">Washlee</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-4 max-w-sm">
              Laundry pickup and delivery across Melbourne. Booked in minutes, washed by trusted local Pros, delivered next day.
            </p>
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <MapPin size={16} className="text-primary" />
              <span>Melbourne, Australia</span>
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/how-it-works" className="hover:text-primary transition">How it works</Link></li>
              <li><Link href="/pricing" className="hover:text-primary transition">Pricing</Link></li>
              <li><Link href="/wash-club" className="hover:text-primary transition">Wash Club</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition">FAQ</Link></li>
              <li><Link href="/about" className="hover:text-primary transition">About</Link></li>
              <li><Link href="/careers" className="hover:text-primary transition">Careers</Link></li>
            </ul>
          </div>

          {/* For Pros */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4">For Pros</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/pro" className="hover:text-primary transition">Become a Pro</Link></li>
              <li><Link href="/pro-support" className="hover:text-primary transition">Pro support</Link></li>
              <li><Link href="/auth/employee-signin" className="hover:text-primary transition">Pro sign in</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/care-guide" className="hover:text-primary transition">Care guide</Link></li>
              <li><Link href="/damage-protection" className="hover:text-primary transition">Damage protection</Link></li>
              <li><Link href="/protection-plan" className="hover:text-primary transition">Protection plan</Link></li>
              <li><Link href="/sustainability" className="hover:text-primary transition">Sustainability</Link></li>
              <li><Link href="/business" className="hover:text-primary transition">Business laundry</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/help-center" className="hover:text-primary transition">Help centre</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition">Contact us</Link></li>
              <li><Link href="/security" className="hover:text-primary transition">Security</Link></li>
              <li><Link href="/terms-of-service" className="hover:text-primary transition">Terms</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-primary transition">Privacy</Link></li>
              <li><Link href="/cookie-policy" className="hover:text-primary transition">Cookies</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-sm text-white/60">
            <p>&copy; {year} Washlee. All rights reserved.</p>
            <a href="mailto:support@washlee.com.au" className="inline-flex items-center gap-2 hover:text-primary transition">
              <Mail size={14} />
              support@washlee.com.au
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
