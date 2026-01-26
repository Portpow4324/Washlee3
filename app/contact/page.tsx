'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { MessageSquare, Mail, Phone, MapPin, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: any) => {
    e.preventDefault()
    // Here you would send the form data to your backend
    console.log('Form submitted:', formData)
    setSubmitted(true)
    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
      setSubmitted(false)
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-mint to-white py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h1 className="text-5xl md:text-6xl font-bold text-dark mb-6">Get In Touch</h1>
            <p className="text-xl text-gray max-w-2xl">
              Have a question? We'd love to hear from you. Send us a message and we'll get back to you as soon as possible.
            </p>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="py-20 max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <Card className="p-8 text-center">
              <MessageSquare size={40} className="text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-dark mb-2">Chat With Us</h3>
              <p className="text-gray mb-4">Available 24/7 for quick questions</p>
              <button className="text-primary font-semibold hover:underline">
                Start Chat →
              </button>
            </Card>

            <Card className="p-8 text-center">
              <Phone size={40} className="text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-dark mb-2">Call Us</h3>
              <p className="text-gray mb-4">Monday-Sunday, 6AM-10PM</p>
              <a href="tel:+1-800-WASHLEE" className="text-primary font-semibold hover:underline">
                1-800-WASHLEE
              </a>
            </Card>

            <Card className="p-8 text-center">
              <Mail size={40} className="text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold text-dark mb-2">Email Us</h3>
              <p className="text-gray mb-4">We'll respond within 24 hours</p>
              <a href="mailto:support@washlee.com" className="text-primary font-semibold hover:underline">
                support@washlee.com
              </a>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-dark mb-8">Send us a message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                {submitted && (
                  <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex gap-2">
                    <AlertCircle size={20} className="flex-shrink-0" />
                    <p>Thank you! We'll get back to you soon.</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">Phone (Optional)</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="(123) 456-7890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">Subject</label>
                  <select
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select a subject</option>
                    <option value="booking">Booking Help</option>
                    <option value="order">Order Issue</option>
                    <option value="pro">Become a Pro</option>
                    <option value="billing">Billing</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    className="w-full px-4 py-3 border border-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Tell us how we can help..."
                  />
                </div>

                <Button size="lg" className="w-full text-white">Send Message</Button>
              </form>
            </div>

            {/* Location & Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-dark mb-8">Contact Information</h2>
                
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <MapPin size={24} className="text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-dark mb-1">Headquarters</h3>
                      <p className="text-gray">
                        123 Laundry Lane<br />
                        San Francisco, CA 94105<br />
                        United States
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Phone size={24} className="text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-dark mb-1">Phone</h3>
                      <p className="text-gray">
                        Main: +1 (800) 924-7543<br />
                        Pro Support: +1 (800) 924-7544<br />
                        Fax: +1 (415) 555-0123
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Mail size={24} className="text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-dark mb-1">Email</h3>
                      <p className="text-gray">
                        support@washlee.com<br />
                        pro@washlee.com<br />
                        careers@washlee.com
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Clock size={24} className="text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-dark mb-1">Business Hours</h3>
                      <p className="text-gray">
                        Monday - Friday: 8:00 AM - 8:00 PM<br />
                        Saturday - Sunday: 10:00 AM - 6:00 PM<br />
                        Holidays: 10:00 AM - 4:00 PM
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="bg-gray-200 rounded-2xl h-64 flex items-center justify-center">
                <div className="text-center">
                  <MapPin size={40} className="text-gray mx-auto mb-2 opacity-50" />
                  <p className="text-gray">Map Integration Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Quick Links */}
        <section className="bg-white py-20 border-t border-gray">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-dark mb-12 text-center">Need Quick Answers?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/faq">
                <Card className="p-8 text-center hover:shadow-lg transition cursor-pointer">
                  <MessageSquare size={32} className="text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-dark">Visit our FAQ</h3>
                  <p className="text-gray text-sm">Find answers to common questions</p>
                </Card>
              </Link>

              <Link href="/help-center">
                <Card className="p-8 text-center hover:shadow-lg transition cursor-pointer">
                  <AlertCircle size={32} className="text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-dark">Help Center</h3>
                  <p className="text-gray text-sm">Browse our knowledge base</p>
                </Card>
              </Link>

              <Link href="/pro">
                <Card className="p-8 text-center hover:shadow-lg transition cursor-pointer">
                  <MessageSquare size={32} className="text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-dark">Become a Pro</h3>
                  <p className="text-gray text-sm">Join our team of professionals</p>
                </Card>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
