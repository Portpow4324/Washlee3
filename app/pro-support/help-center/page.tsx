'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Search, HelpCircle, BookOpen, Package, DollarSign, Award, User, Zap, Home, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ProHelpCenter() {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const categories = [
    {
      title: 'Getting Started',
      icon: BookOpen,
      description: 'Learn how to set up your account and get your first order',
      articles: 12,
    },
    {
      title: 'Order Support',
      icon: Package,
      description: 'Find help with managing, tracking, and completing orders',
      articles: 24,
    },
    {
      title: 'Your Money',
      icon: DollarSign,
      description: 'Information about payments, earnings, and payouts',
      articles: 18,
    },
    {
      title: 'Rank, Points, and Badges',
      icon: Award,
      description: 'Understand how our ranking and rewards system works',
      articles: 15,
    },
    {
      title: 'Account',
      icon: User,
      description: 'Manage your profile, settings, and account information',
      articles: 20,
    },
    {
      title: 'Tech Help',
      icon: Zap,
      description: 'Troubleshoot technical issues and app problems',
      articles: 22,
    },
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // In a real app, this would search knowledge base
      console.log('Searching for:', searchQuery)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Brand Name - Clickable to Home */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo-washlee.png"
              alt="Washlee Logo"
              width={48}
              height={48}
              className="rounded-full"
            />
            <span className="text-2xl font-bold text-dark group-hover:text-primary transition">Washlee</span>
          </Link>

          {/* Top Right Buttons */}
          <div className="flex items-center gap-4">
            <Link
              href="/auth/pro-signup"
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-dark font-semibold hover:text-primary transition"
            >
              Join The Team
            </Link>
            <Link
              href="/pro-support/help-center"
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-dark font-semibold hover:text-primary transition"
            >
              Submit a request
            </Link>
            <Link
              href="/auth/pro-signin"
              className="hidden sm:flex items-center gap-2 px-4 py-2 text-dark font-semibold hover:text-primary transition"
            >
              Sign In
            </Link>
            
            {/* Help Icon Button */}
            <button
              onClick={() => router.push('/pro-support/help-center')}
              className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-white transition"
              title="Help Center"
            >
              <HelpCircle size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-mint to-white py-16 sm:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-dark mb-6">
              Laundry Pro Help Center
            </h1>
            <p className="text-xl text-gray mb-10">
              How can we help you?
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for articles, guides, and support..."
                  className="w-full pl-12 pr-6 py-4 border-2 border-gray rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-mint transition text-dark placeholder-gray"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-accent transition"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-16 sm:py-24 bg-light">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-dark mb-2">Categories</h2>
              <p className="text-gray text-lg">Browse our knowledge base by category</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => {
                const Icon = category.icon
                return (
                  <Link
                    key={index}
                    href="/pro-support/help-center"
                    className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition group cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-mint rounded-lg p-3">
                        <Icon size={24} className="text-primary" />
                      </div>
                      <span className="text-sm font-semibold text-gray bg-light px-3 py-1 rounded-full">
                        {category.articles} articles
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-dark mb-2 group-hover:text-primary transition">
                      {category.title}
                    </h3>
                    <p className="text-gray text-sm mb-4">{category.description}</p>
                    <div className="flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition">
                      View Articles
                      <ArrowRight size={16} />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* Knowledge Base Section */}
        <section className="py-16 sm:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-dark mb-12">Knowledge Base</h2>
            <p className="text-gray text-lg mb-8">
              Browse our complete knowledge base or start with the most popular articles
            </p>
            
            <div className="bg-light rounded-xl p-8 text-center">
              <p className="text-gray">Knowledge Base content coming soon...</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold mb-4">About Washlee</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link href="#" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="#" className="hover:text-white transition">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link href="#" className="hover:text-white transition">Help Center</Link></li>
                <li><Link href="#" className="hover:text-white transition">Contact Us</Link></li>
                <li><Link href="#" className="hover:text-white transition">Submit a Request</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link href="/terms-of-service" className="hover:text-white transition">Terms of Service</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-white transition">Privacy Policy</Link></li>
                <li><Link href="/cookie-policy" className="hover:text-white transition">Cookie Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-white/70">
                <li><Link href="#" className="hover:text-white transition">Twitter</Link></li>
                <li><Link href="#" className="hover:text-white transition">Facebook</Link></li>
                <li><Link href="#" className="hover:text-white transition">Instagram</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 pt-8 text-center text-sm text-white/70">
            <p>&copy; 2026 Washlee. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
