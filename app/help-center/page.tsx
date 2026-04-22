'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { Search, MessageCircle, BookOpen, AlertCircle, ChevronDown } from 'lucide-react'
import Link from 'next/link'

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const categories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: '🚀',
      articles: [
        { id: 1, title: 'How to Create an Account', views: 2500 },
        { id: 2, title: 'How to Book Your First Order', views: 2300 },
        { id: 3, title: 'Setting Up Your Preferences', views: 1200 },
        { id: 4, title: 'Understanding WASH Club', views: 890 },
      ]
    },
    {
      id: 'orders',
      title: 'Orders & Tracking',
      icon: '📦',
      articles: [
        { id: 5, title: 'How to Track Your Order', views: 3100 },
        { id: 6, title: 'Changing Your Order Details', views: 1450 },
        { id: 7, title: 'Cancelling or Rescheduling', views: 2200 },
        { id: 8, title: 'Same-Day Delivery Options', views: 1600 },
      ]
    },
    {
      id: 'billing',
      title: 'Billing & Payment',
      icon: '💳',
      articles: [
        { id: 9, title: 'Payment Methods & Security', views: 2100 },
        { id: 10, title: 'Understanding Your Invoice', views: 890 },
        { id: 11, title: 'Refund Policy', views: 1950 },
        { id: 12, title: 'Adding a Payment Method', views: 1340 },
      ]
    },
    {
      id: 'laundry',
      title: 'Laundry Care',
      icon: '👕',
      articles: [
        { id: 13, title: 'Detergent Types Explained', views: 1670 },
        { id: 14, title: 'Special Care Instructions', views: 2340 },
        { id: 15, title: 'Handling Delicate Items', views: 1780 },
        { id: 16, title: 'Water Temperature Guide', views: 945 },
      ]
    },
    {
      id: 'account',
      title: 'Account & Settings',
      icon: '⚙️',
      articles: [
        { id: 17, title: 'Managing Your Profile', views: 1200 },
        { id: 18, title: 'Privacy & Security Settings', views: 2450 },
        { id: 19, title: 'Notification Preferences', views: 980 },
        { id: 20, title: 'Resetting Your Password', views: 2100 },
      ]
    },
    {
      id: 'pro',
      title: 'For Washlee Pros',
      icon: '💼',
      articles: [
        { id: 21, title: 'Accepting Jobs', views: 1890 },
        { id: 22, title: 'Earning & Payouts', views: 2670 },
        { id: 23, title: 'Pro Requirements', views: 1540 },
        { id: 24, title: 'Managing Your Schedule', views: 1320 },
      ]
    },
  ]

  const faqs = [
    {
      question: "What areas do you deliver to?",
      answer: "Washlee is currently available in major metropolitan areas including San Francisco, Oakland, Berkeley, and surrounding regions. We're expanding to new areas regularly! Check our service map in the app to see if your location is covered."
    },
    {
      question: "How much does Washlee cost?",
      answer: "Our base price is $3.00 per kilogram. Standard delivery is included. Same-day delivery is available for an additional $5.00."
    },
    {
      question: "How long does it take?",
      answer: "Standard service includes pickup and delivery typically within 24 hours. Same-day delivery is available in select areas. ASAP pickups can be scheduled as soon as 2 hours from booking."
    },
    {
      question: "Are my clothes safe?",
      answer: "Yes! All our Washlee Pros are background-checked and insured. Your clothes are treated with care using professional techniques and quality detergents. We also offer special handling for delicate items."
    },
    {
      question: "Can I contact my Pro?",
      answer: "Absolutely! Once your Pro is assigned, you can message or call them directly through the app. You can also track their arrival in real-time just like a rideshare service."
    },
    {
      question: "What if I'm not home during pickup?",
      answer: "No problem! Many customers leave their laundry in a designated spot (porch, lobby, etc.). Just let your Pro know via the app. Contactless pickup is available."
    },
    {
      question: "Can I schedule recurring orders?",
      answer: "Not yet, but recurring orders are coming soon! For now, you can book orders as needed. WASH Club members get discounted rates on all orders."
    },
    {
      question: "What if there's an issue with my order?",
      answer: "Contact our support team immediately via chat, phone, or email. We're available 24/7 and will resolve any issues quickly. Your satisfaction is guaranteed."
    },
  ]

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-mint to-white py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h1 className="text-5xl md:text-6xl font-bold text-dark mb-6">Help Center</h1>
            <p className="text-xl text-gray max-w-2xl mb-8">
              Find answers, solve problems, and learn how to make the most of Washlee.
            </p>

            {/* Search Bar */}
            <div className="flex gap-2 max-w-2xl">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-3 top-3 text-gray" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search help articles..."
                  className="w-full pl-10 pr-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button size="sm">Search</Button>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-20 max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
            {/* Categories Sidebar */}
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-bold text-dark mb-6">Categories</h2>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-mint hover:text-primary transition font-semibold text-gray"
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.title}
                  </button>
                ))}
              </div>

              {/* Contact Card */}
              <Card className="p-6 mt-8 bg-primary text-white">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <MessageCircle size={20} />
                  Still Need Help?
                </h3>
                <p className="text-sm mb-4 text-mint">Our support team is ready to help.</p>
                <Link href="/contact">
                  <Button size="sm" variant="outline" className="w-full">Contact Support</Button>
                </Link>
              </Card>
            </div>

            {/* Articles Grid */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-dark mb-8">Popular Articles</h2>
              <div className="space-y-4">
                {categories.slice(0, 3).map((category) => (
                  <div key={category.id}>
                    <h3 className="text-lg font-bold text-dark mb-4">{category.icon} {category.title}</h3>
                    <div className="space-y-3 mb-8">
                      {category.articles.slice(0, 3).map((article) => (
                        <Card key={article.id} className="p-4 hover:shadow-lg transition cursor-pointer">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-dark hover:text-primary">{article.title}</h4>
                              <p className="text-xs text-gray mt-1">{article.views.toLocaleString()} views</p>
                            </div>
                            <ChevronDown size={20} className="text-gray flex-shrink-0" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* View All */}
              <Button size="lg" variant="outline" className="w-full">View All Articles</Button>
            </div>
          </div>

          {/* FAQs */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-dark mb-12 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {filteredFaqs.map((faq, index) => (
                <Card key={index} className="p-6">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full flex items-start justify-between gap-4"
                  >
                    <div className="text-left">
                      <h3 className="font-bold text-dark text-lg">{faq.question}</h3>
                    </div>
                    <ChevronDown
                      size={24}
                      className={`text-primary flex-shrink-0 transition ${
                        expandedFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {expandedFaq === index && (
                    <p className="text-gray mt-4 leading-relaxed">{faq.answer}</p>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Contact Options */}
          <div className="bg-primary text-white rounded-2xl p-12">
            <h2 className="text-3xl font-bold mb-8 text-center">We're Here to Help</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl mb-2">💬</div>
                <h3 className="font-bold mb-2">Live Chat</h3>
                <p className="text-mint text-sm">24/7 support</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">📞</div>
                <h3 className="font-bold mb-2">Phone Support</h3>
                <p className="text-mint text-sm">1-800-WASHLEE</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">📧</div>
                <h3 className="font-bold mb-2">Email Us</h3>
                <p className="text-mint text-sm">support@washlee.com</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
