'use client'

import Link from 'next/link'
import { Facebook, Twitter, Instagram, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-dark text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="font-bold text-lg mb-4">Washlee</h3>
            <p className="text-gray text-sm">
              On-demand laundry service that picks up, cleans, and delivers your clothes. Life's too short for laundry.
            </p>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-gray">
              <li>
                <Link href="/how-it-works" className="hover:text-primary transition">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-primary transition">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary transition">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/loyalty" className="hover:text-primary transition">
                  WASH Club
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-primary transition">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* For Pros */}
          <div>
            <h3 className="font-bold mb-4">For Pros</h3>
            <ul className="space-y-2 text-sm text-gray">
              <li>
                <Link href="/pro" className="hover:text-primary transition">
                  Become a Washlee Pro
                </Link>
              </li>
              <li>
                <Link href="/pro-support" className="hover:text-primary transition">
                  Pro Support
                </Link>
              </li>
              <li>
                <a href="/dashboard/pro" className="hover:text-primary transition">
                  Pro Dashboard
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-gray">
              <li>
                <Link href="/help-center" className="hover:text-primary transition">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition">
                  Contact Us
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition">
                  Status
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-gray">
              <li>
                <Link href="/terms-of-service" className="hover:text-primary transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="hover:text-primary transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="hover:text-primary transition">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray">
            <p>&copy; 2026 Washlee. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="/privacy-policy" className="hover:text-primary transition">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="hover:text-primary transition">
                Terms of Service
              </Link>
              <Link href="/cookie-policy" className="hover:text-primary transition">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
