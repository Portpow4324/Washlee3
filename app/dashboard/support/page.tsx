'use client'

import { useState } from 'react'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { MessageCircle, Search, ChevronDown, Send } from 'lucide-react'

export default function Support() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [expandedArticle, setExpandedArticle] = useState<number | null>(null)
  const [showContactForm, setShowContactForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const categories = [
    { id: 'all', label: 'All Articles', count: 24 },
    { id: 'orders', label: 'Orders & Tracking', count: 5 },
    { id: 'account', label: 'Account & Billing', count: 4 },
    { id: 'pricing', label: 'Pricing & Plans', count: 3 },
    { id: 'delivery', label: 'Delivery & Pickup', count: 4 },
    { id: 'care', label: 'Laundry Care', count: 5 },
    { id: 'technical', label: 'Technical Issues', count: 3 },
  ]

  const articles = [
    {
      id: 1,
      category: 'orders',
      title: 'How do I place an order?',
      content:
        'Visit our website or mobile app, select your pickup time, add your laundry, and checkout. Our drivers will arrive during your selected window.',
    },
    {
      id: 2,
      category: 'orders',
      title: 'Can I modify my order after placing it?',
      content:
        'Yes, you can modify orders within 1 hour of placing them. Go to your dashboard, find the order, and click Edit. After 1 hour, please contact support.',
    },
    {
      id: 3,
      category: 'orders',
      title: 'How can I track my order?',
      content:
        'Once your order is confirmed, you can track it in real-time through the "Tracking" page or in your dashboard. You\'ll receive SMS and email updates too.',
    },
    {
      id: 4,
      category: 'orders',
      title: 'What happens if my driver is late?',
      content:
        'Our drivers arrive within a 60-minute window. If they\'re more than 15 minutes late, you receive a $5 credit automatically. Contact support for additional assistance.',
    },
    {
      id: 5,
      category: 'orders',
      title: 'Can I request a specific time?',
      content:
        'Yes, during checkout you can select your preferred time window. Premium members get priority scheduling for specific times.',
    },
    {
      id: 6,
      category: 'account',
      title: 'How do I reset my password?',
      content:
        'Click "Forgot Password" on the login page, enter your email, and follow the link sent to your inbox. You have 24 hours to reset your password.',
    },
    {
      id: 7,
      category: 'account',
      title: 'Can I have multiple accounts?',
      content:
        'We recommend one account per person, but you can have multiple addresses. If you need a separate account, please contact support.',
    },
    {
      id: 8,
      category: 'account',
      title: 'How do I delete my account?',
      content:
        'Go to Settings > Account > Delete Account. Your data will be permanently deleted after 30 days. You can still view order history during this period.',
    },
    {
      id: 9,
      category: 'account',
      title: 'How do I update my payment method?',
      content:
        'Visit your dashboard and go to Payment Methods. You can add, remove, or update cards anytime. Changes take effect immediately.',
    },
    {
      id: 10,
      category: 'pricing',
      title: 'What is included in the pricing?',
      content:
        'Our pricing includes pickup, delivery, washing, drying, and folding. Add-ons like hand washing or express service can be selected during checkout.',
    },
    {
      id: 11,
      category: 'pricing',
      title: 'Do you offer student discounts?',
      content:
        'Yes! Students get 15% off their first 3 orders. Verify with your .edu email and the discount applies automatically.',
    },
    {
      id: 12,
      category: 'pricing',
      title: 'Can I get a refund?',
      content:
        'We offer a 100% money-back guarantee if you\'re not satisfied. Contact support within 24 hours of delivery with photos of any issues.',
    },
    {
      id: 13,
      category: 'delivery',
      title: 'What areas do you deliver to?',
      content:
        'Enter your address during checkout to see if we deliver to your area. Currently serving the Bay Area, Los Angeles, and San Diego.',
    },
    {
      id: 14,
      category: 'delivery',
      title: 'What if I\'m not home for pickup?',
      content:
        'You can authorize our drivers to leave laundry in a safe place. Add delivery instructions in your order details or contact us in advance.',
    },
    {
      id: 15,
      category: 'delivery',
      title: 'How do I schedule a recurring order?',
      content:
        'Premium subscribers can set recurring weekly or bi-weekly pickups. Enable this in your subscription settings. Orders can be skipped anytime.',
    },
    {
      id: 16,
      category: 'delivery',
      title: 'Is there an extra charge for multiple addresses?',
      content:
        'No! Save multiple addresses in your profile and select which one for each order. No extra charges for pickups from different locations.',
    },
    {
      id: 17,
      category: 'care',
      title: 'Do you handle delicate items?',
      content:
        'Absolutely! We offer hand-washing for delicates, silk, and wool. Select "Delicate Care" during checkout. Premium for $3 extra per order.',
    },
    {
      id: 18,
      category: 'care',
      title: 'How do you treat stains?',
      content:
        'Our professional cleaners treat common stains free of charge. For difficult stains, select "Stain Treatment" ($2 extra). Note any specific stains in delivery instructions.',
    },
    {
      id: 19,
      category: 'care',
      title: 'Can I request hang-drying?',
      content:
        'Yes! Select "Hang Dry" during checkout for an additional $2. Perfect for delicate fabrics or items that shouldn\'t go in the dryer.',
    },
    {
      id: 20,
      category: 'care',
      title: 'Do you wash bedding?',
      content:
        'Yes, including sheets, pillowcases, and comforters. Select "Bedding" as the item type. Comforters have a $5 surcharge due to special handling.',
    },
    {
      id: 21,
      category: 'care',
      title: 'What detergent do you use?',
      content:
        'We use hypoallergenic, eco-friendly detergent. For sensitive skin, select "Hypoallergenic Only" in preferences. We also offer fragrance-free options.',
    },
    {
      id: 22,
      category: 'technical',
      title: 'The app won\'t let me place an order',
      content:
        'Try clearing app cache, updating to the latest version, or restarting your phone. Still having issues? Contact support with a screenshot of the error.',
    },
    {
      id: 23,
      category: 'technical',
      title: 'I\'m not receiving notifications',
      content:
        'Check your phone settings to ensure notifications are enabled for the Washlee app. Go to app Settings > Notifications and toggle on all notification types.',
    },
    {
      id: 24,
      category: 'technical',
      title: 'The website is running slow',
      content:
        'Clear your browser cache and cookies, disable browser extensions, and try a different browser. Contact support if issues persist.',
    },
  ]

  const filteredArticles = articles.filter(
    (article) =>
      (selectedCategory === 'all' || article.category === selectedCategory) &&
      (searchQuery === ''
        ? true
        : article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.content.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-8">
      {/* Search & CTA */}
      <div className="flex flex-col gap-4">
        <div className="relative">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray" />
          <input
            type="text"
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        {!showContactForm && (
          <Button onClick={() => setShowContactForm(true)} variant="outline" className="flex items-center gap-2">
            <MessageCircle size={18} />
            Need help? Contact Support
          </Button>
        )}
      </div>

      {/* Contact Form */}
      {showContactForm && (
        <Card className="bg-mint/5 border-2 border-primary">
          <h3 className="text-lg font-bold text-dark mb-4">Contact Support</h3>
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Your email"
              className="w-full px-4 py-3 border-2 border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select className="w-full px-4 py-3 border-2 border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option>Select a topic...</option>
              <option>Orders & Tracking</option>
              <option>Account & Billing</option>
              <option>Laundry Care</option>
              <option>Technical Issues</option>
              <option>Other</option>
            </select>
            <textarea
              placeholder="Describe your issue..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <div className="flex gap-3">
              <Button className="flex items-center gap-2">
                <Send size={18} />
                Send Message
              </Button>
              <button
                onClick={() => setShowContactForm(false)}
                className="px-6 py-2 border-2 border-gray rounded-lg text-dark font-semibold hover:bg-light transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Categories */}
      <div>
        <h2 className="text-lg font-bold text-dark mb-4">Browse by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`p-4 rounded-lg font-semibold transition text-sm ${
                selectedCategory === cat.id
                  ? 'bg-primary text-white'
                  : 'bg-light text-dark border-2 border-gray hover:border-primary'
              }`}
            >
              {cat.label}
              <span className={`ml-2 text-xs ${selectedCategory === cat.id ? 'opacity-80' : 'text-gray'}`}>
                ({cat.count})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Articles List */}
      <div>
        <h2 className="text-lg font-bold text-dark mb-4">
          {filteredArticles.length} {selectedCategory === 'all' ? 'Articles' : 'Articles in this category'}
        </h2>
        <div className="space-y-3">
          {filteredArticles.length > 0 ? (
            filteredArticles.map((article) => (
              <button
                key={article.id}
                onClick={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
                className="w-full text-left"
              >
                <Card className="cursor-pointer hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-dark">{article.title}</h3>
                      {expandedArticle === article.id && (
                        <p className="text-gray text-sm mt-3">{article.content}</p>
                      )}
                    </div>
                    <ChevronDown
                      size={20}
                      className={`text-primary flex-shrink-0 transition ${
                        expandedArticle === article.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </Card>
              </button>
            ))
          ) : (
            <Card className="text-center py-12">
              <p className="text-gray">No articles found. Try a different search or category.</p>
            </Card>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-lg font-bold text-dark mb-4">Can't find what you're looking for?</h2>
        <Card>
          <p className="text-gray mb-4">Our support team typically responds within 2 hours during business hours (9 AM - 6 PM PT, Mon-Fri).</p>
          <div className="flex gap-3">
            <Button>Email Support</Button>
            <button className="px-6 py-2 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-mint transition">
              Live Chat (Coming Soon)
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}
