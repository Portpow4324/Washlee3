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
    { id: 'all', label: 'All articles', count: 18 },
    { id: 'orders', label: 'Orders & tracking', count: 5 },
    { id: 'account', label: 'Account & billing', count: 4 },
    { id: 'pricing', label: 'Pricing & Wash Club', count: 3 },
    { id: 'delivery', label: 'Pickup & delivery', count: 3 },
    { id: 'care', label: 'Laundry care', count: 3 },
  ]

  const articles = [
    {
      id: 1,
      category: 'orders',
      title: 'How do I place an order?',
      content:
        'Use the website or mobile app to choose your service, bag size, pickup address, and time window. Standard wash & fold is $7.50/kg, express is $12.50/kg, and the minimum order is $75.',
    },
    {
      id: 2,
      category: 'orders',
      title: 'Can I modify my order after placing it?',
      content:
        'Open the order from your dashboard. If the order has not progressed too far, you can request a change or contact support. Once a Pro is already on the way or the order is being processed, changes may be limited.',
    },
    {
      id: 3,
      category: 'orders',
      title: 'How can I track my order?',
      content:
        'Open Tracking or the order detail page from your dashboard. You will see the current status, timeline steps, and any available proof or delivery details.',
    },
    {
      id: 4,
      category: 'orders',
      title: 'What happens if my driver is late?',
      content:
        'Pickup windows can shift because Pros are independent contractors working across Melbourne traffic. If your pickup is running late, check the tracking page first, then contact support if you need help.',
    },
    {
      id: 5,
      category: 'orders',
      title: 'Can I cancel my order?',
      content:
        'Yes, where the order status allows it. Open the order and use the cancellation option. If payment has already been taken, support may need to review refund handling.',
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
        'Use account settings where available, or contact support@washlee.com.au. We will guide you through account deletion and any order-history or legal retention requirements.',
    },
    {
      id: 9,
      category: 'account',
      title: 'How do I update my payment method?',
      content:
        'Go to the payments section in your dashboard or update payment details during checkout. Never send card details through chat or email.',
    },
    {
      id: 10,
      category: 'pricing',
      title: 'What is included in the pricing?',
      content:
        'Pricing includes pickup, delivery, washing, drying, and folding in the Melbourne service area. Standard is $7.50/kg, express is $12.50/kg, and the minimum order is $75.',
    },
    {
      id: 11,
      category: 'pricing',
      title: 'Is Wash Club a paid membership?',
      content:
        'No. Wash Club is a free loyalty/rewards program. Washlee is pay-per-order, and there are no paid Wash Club membership fees.',
    },
    {
      id: 12,
      category: 'pricing',
      title: 'Can I get a refund?',
      content:
        'If something went wrong, open the order and contact support with photos and details. Refunds, credits, and protection claims are reviewed against the order and protection policy.',
    },
    {
      id: 13,
      category: 'delivery',
      title: 'What areas do you deliver to?',
      content:
        'Enter your address during booking to confirm we cover your suburb. We currently service Greater Melbourne and are expanding regularly.',
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
      title: 'Can I use a different pickup and delivery address?',
      content:
        'Yes, where the booking flow allows it. Add both addresses and make sure the delivery address is inside the active Melbourne service area.',
    },
    {
      id: 16,
      category: 'care',
      title: 'Do you handle delicate items?',
      content:
        'Select delicates / special care and add notes during booking. Delicates are charged at the standard $7.50/kg rate, but dry-clean-only items should be flagged before sending.',
    },
    {
      id: 17,
      category: 'care',
      title: 'How do you treat stains?',
      content:
        'Add stain notes during booking so the load can be reviewed properly. Common stains may be pre-treated, but stain removal cannot be guaranteed.',
    },
    {
      id: 18,
      category: 'care',
      title: 'Can I request hang-drying?',
      content:
        'Yes. Select Hang Dry during checkout for +$16.50. It is useful for delicate fabrics or items that should not be tumble dried.',
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
          <p className="text-gray mb-4">Our support team reviews messages during Melbourne business hours. For urgent order issues, include your order number and photos where relevant.</p>
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
