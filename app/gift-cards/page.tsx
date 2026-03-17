'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Link from 'next/link'
import { Gift, Check, Heart, Users, Zap, Mail, Lightbulb, CheckCircle } from 'lucide-react'
import { useState } from 'react'

export default function GiftCardsPage() {
  const [selectedAmount, setSelectedAmount] = useState(50)

  return (
    <>
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-mint to-white py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Gift size={60} className="text-primary mx-auto mb-6" />
          <h1 className="text-5xl sm:text-6xl font-bold text-dark mb-6">Give the Gift of Fresh Laundry</h1>
          <p className="text-xl text-gray max-w-2xl mx-auto">
            A Washlee gift card gives time back to the people you care about. The perfect gift for busy professionals, new parents, college students, and anyone overwhelmed with laundry.
          </p>
        </div>
      </section>

      {/* Why Gift Cards */}
      <section className="section bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-dark text-center mb-12">Why Washlee Gift Cards?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Heart size={40} className="text-primary" />,
                title: 'The Perfect Gift',
                desc: 'Give the gift of time. Let recipients focus on what matters while we handle their laundry.',
              },
              {
                icon: <Zap size={40} className="text-primary" />,
                title: 'No Expiration',
                desc: 'Use it whenever. Gift cards never expire, and recipients can use them on any service.',
              },
              {
                icon: <Users size={40} className="text-primary" />,
                title: 'For Everyone',
                desc: 'College students, busy parents, professionals, anyone juggling too much.',
              },
              {
                icon: <Check size={40} className="text-primary" />,
                title: 'Easy to Give',
                desc: 'Digital delivery via email, physical card available, or add to an order.',
              },
              {
                icon: <Gift size={40} className="text-primary" />,
                title: 'Any Amount',
                desc: 'Choose any amount from $25 to $500. Perfect for any budget.',
              },
              {
                icon: <Mail size={40} className="text-primary" />,
                title: 'Personal Message',
                desc: 'Include a custom message to make it extra special.',
              },
            ].map((item, i) => (
              <Card key={i} className="text-center">
                <div className="flex justify-center mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-dark mb-2">{item.title}</h3>
                <p className="text-gray text-sm">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Amounts */}
      <section className="section bg-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-dark text-center mb-12">Popular Gift Amounts</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              {
                amount: 25,
                title: 'Getting Started',
                includes: ['~2 orders', '~8 lbs total', 'Great intro gift'],
                for: 'College students, first-time users',
              },
              {
                amount: 75,
                title: 'Monthly Refresh',
                includes: ['~6 orders', '~24 lbs total', 'A month of laundry'],
                for: 'Busy professionals',
                featured: true,
              },
              {
                amount: 150,
                title: 'Quarterly Relief',
                includes: ['~12 orders', '~48 lbs total', '3 months of care'],
                for: 'New parents, caregivers',
              },
            ].map((item, i) => (
              <Card
                key={i}
                hoverable
                className={item.featured ? 'ring-2 ring-primary scale-105' : ''}
              >
                <div className={item.featured ? 'text-center mb-4' : ''}>
                  {item.featured && <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-bold">MOST POPULAR</span>}
                </div>
                <p className="text-5xl font-bold text-primary mb-2">${item.amount}</p>
                <h3 className="text-2xl font-bold text-dark mb-3">{item.title}</h3>
                <ul className="space-y-2 mb-4">
                  {item.includes.map((inc, j) => (
                    <li key={j} className="flex items-center gap-2 text-gray text-sm">
                      <Check size={16} className="text-primary" />
                      {inc}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-gray italic">{item.for}</p>
              </Card>
            ))}
          </div>

          <Card className="bg-mint border-2 border-primary/20">
            <p className="text-center text-dark flex items-center justify-center gap-2">
              <Lightbulb size={18} className="text-primary flex-shrink-0" />
              <span><span className="font-semibold">Tip:</span> A typical load is 8-10 lbs and costs $3-5, so a $50 gift card covers about 10 loads.</span>
            </p>
          </Card>
        </div>
      </section>

      {/* Custom Amount */}
      <section className="section bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-dark text-center mb-12">Create a Custom Gift Card</h2>
          
          <Card className="p-8">
            <div className="space-y-6">
              <div>
                <label className="block font-bold text-dark mb-4">Select or Enter Amount</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[25, 50, 75, 100, 150, 200, 300, 500].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setSelectedAmount(amount)}
                      className={`py-3 px-4 rounded-lg font-bold transition border-2 ${
                        selectedAmount === amount
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white text-dark border-gray/20 hover:border-primary'
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="customAmount" className="block font-bold text-dark mb-2">
                  Or enter custom amount
                </label>
                <div className="flex gap-2">
                  <span className="flex items-center text-2xl font-bold text-dark">$</span>
                  <input
                    type="number"
                    id="customAmount"
                    value={selectedAmount}
                    onChange={(e) => setSelectedAmount(Number(e.target.value))}
                    min="25"
                    max="500"
                    className="flex-1 px-4 py-3 border-2 border-gray/20 rounded-lg focus:outline-none focus:border-primary text-lg"
                  />
                </div>
                <p className="text-sm text-gray mt-2">Minimum $25 • Maximum $500</p>
              </div>

              <div>
                <label className="block font-bold text-dark mb-3">Delivery Method</label>
                <div className="space-y-3">
                  {[
                    { method: 'Digital', desc: 'Emailed immediately with custom message' },
                    { method: 'Physical', desc: 'Beautifully designed card mailed to recipient' },
                    { method: 'Physical + Email', desc: 'Both physical card and email confirmation' },
                  ].map((item, i) => (
                    <label key={i} className="flex items-center gap-3 p-3 border-2 border-gray/20 rounded-lg hover:border-primary cursor-pointer">
                      <input type="radio" name="delivery" defaultChecked={i === 0} className="w-4 h-4" />
                      <div>
                        <p className="font-semibold text-dark">{item.method}</p>
                        <p className="text-sm text-gray">{item.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="message" className="block font-bold text-dark mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  id="message"
                  placeholder="E.g., 'I know you're busy! Let Washlee give you some time back. Enjoy!'"
                  className="w-full px-4 py-3 border-2 border-gray/20 rounded-lg focus:outline-none focus:border-primary"
                  rows={4}
                />
              </div>

              <div className="bg-light p-4 rounded-lg">
                <p className="font-bold text-dark mb-2">Order Summary</p>
                <div className="space-y-2 text-gray">
                  <div className="flex justify-between">
                    <span>Gift Card Amount:</span>
                    <span className="font-bold text-dark">${selectedAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery:</span>
                    <span className="font-bold text-dark">Free</span>
                  </div>
                  <div className="border-t border-gray/20 pt-2 mt-2 flex justify-between">
                    <span className="font-bold">Total:</span>
                    <span className="text-2xl font-bold text-primary">${selectedAmount}</span>
                  </div>
                </div>
              </div>

              <Button size="lg" className="w-full">
                Buy Gift Card Now
              </Button>
            </div>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="section bg-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-dark text-center mb-12">How Gift Cards Work</h2>
          
          <div className="space-y-6">
            {[
              {
                step: '1',
                title: 'You Purchase a Gift Card',
                description: 'Select an amount, delivery method, and add a personal message.',
              },
              {
                step: '2',
                title: 'Recipient Gets Notified',
                description: 'They receive it instantly (digital) or within 2-3 days (physical), with your personal message.',
              },
              {
                step: '3',
                title: 'They Create an Account',
                description: 'New users sign up with their email (takes 30 seconds). Existing users can use theirs.',
              },
              {
                step: '4',
                title: 'They Apply the Card',
                description: 'They enter the gift card code at checkout, and the balance is available to use.',
              },
              {
                step: '5',
                title: 'They Enjoy Washlee',
                description: 'Place their first order! The gift card balance is applied to any service.',
              },
            ].map((item, i) => (
              <Card key={i} className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-white font-bold">
                    {item.step}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-dark mb-2">{item.title}</h3>
                  <p className="text-gray">{item.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-dark text-center mb-12">Gift Card Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { feature: 'No Expiration Date', desc: 'Use it whenever, no time limit' },
              { feature: 'Easy to Share', desc: 'Forward the email or gift the physical card' },
              { feature: 'Work with Everything', desc: 'Use for any Washlee service' },
              { feature: 'Can Be Combined', desc: 'Stack multiple cards on one order' },
              { feature: 'Easy Balance Check', desc: 'View remaining balance anytime in app' },
              { feature: 'Refundable Balance', desc: 'Unused balance can be transferred or refunded' },
              { feature: 'Team Gifting', desc: 'Bulk discounts available for companies' },
              { feature: 'Corporate Accounts', desc: 'Setup program for employee benefits' },
            ].map((item, i) => (
              <Card key={i}>
                <div className="flex gap-3 items-start">
                  <CheckCircle size={20} className="text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-dark text-lg mb-1">{item.feature}</p>
                    <p className="text-gray text-sm">{item.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Corporate Gifting */}
      <section className="section bg-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-dark text-center mb-12">Corporate & Team Gifting</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card hoverable>
              <h3 className="text-2xl font-bold text-primary mb-4">For Companies</h3>
              <ul className="space-y-3">
                {[
                  'Employee wellness program',
                  'Customer appreciation gifts',
                  'New hire welcome packages',
                  'Client retention rewards',
                  'Team morale booster',
                  'Special event giveaway',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray">
                    <Check size={18} className="text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>

            <Card hoverable className="bg-mint">
              <h3 className="text-2xl font-bold text-primary mb-4">Volume Benefits</h3>
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-dark">10-49 cards</p>
                  <p className="text-primary">5% discount</p>
                </div>
                <div>
                  <p className="font-semibold text-dark">50-99 cards</p>
                  <p className="text-primary">10% discount</p>
                </div>
                <div>
                  <p className="font-semibold text-dark">100+ cards</p>
                  <p className="text-primary">Contact for custom pricing</p>
                </div>
                <div className="pt-4 border-t border-primary/20">
                  <p className="text-sm text-gray">
                    <span className="font-semibold">Plus:</span> Dedicated account manager, custom branding, flexible delivery timing
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <p className="text-lg text-gray mb-6">Interested in corporate gifting?</p>
            <div className="flex justify-center">
              <Link href="mailto:corporate@washlee.com">
                <Button variant="outline" size="lg">Get Corporate Pricing</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-dark text-center mb-12">Gift Card FAQ</h2>
          
          <div className="space-y-4">
            {[
              {
                q: 'Can gift cards be used online?',
                a: 'Yes! Recipients can use the gift card code at checkout, just like a regular payment method.',
              },
              {
                q: 'What if they don\'t have a Washlee account?',
                a: 'That\'s fine. When they enter the gift card code at checkout, they\'ll be guided to create an account (takes 30 seconds).',
              },
              {
                q: 'Can I buy gift cards as gifts for myself?',
                a: 'Absolutely! Some people buy them as a way to prepay for their own service. It\'s prepaid laundry!',
              },
              {
                q: 'Do gift cards expire?',
                a: 'No! Gift cards never expire. Use them whenever you want, even 5 years from now.',
              },
              {
                q: 'Can I get a refund for an unused gift card?',
                a: 'Yes. If the recipient decides not to use it, the card can be refunded or transferred to another person.',
              },
              {
                q: 'Can I combine multiple gift cards?',
                a: 'Yes! Recipients can combine multiple gift cards on a single order. Each code applies to the balance.',
              },
              {
                q: 'What if the recipient moves away?',
                a: 'No problem. Washlee operates in all major cities, and gift cards work nationwide.',
              },
              {
                q: 'Do you offer bulk discounts for corporate gifting?',
                a: 'Yes! 10+ cards get 5% off, 50+ get 10% off. Contact our corporate team for larger orders.',
              },
            ].map((item, i) => (
              <Card key={i}>
                <h3 className="font-bold text-dark mb-2">{item.q}</h3>
                <p className="text-gray">{item.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-gradient-to-br from-primary/10 to-mint text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Gift size={60} className="text-primary mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-dark mb-6">Ready to Give the Gift of Time?</h2>
          <p className="text-lg text-gray mb-8">
            Perfect for any occasion. No expiration. Unlimited possibilities.
          </p>
          <Button size="lg">Buy a Gift Card Now</Button>
        </div>
      </section>

      <Footer />
    </>
  )
}
