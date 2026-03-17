'use client'

import React from 'react'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Link from 'next/link'
import { CheckCircle, Clock, Sparkles, Shield, Truck, Users, Shirt, Cloud, Hand, Droplet } from 'lucide-react'

export default function ServicesPage() {
  const services = [
    {
      id: 'standard',
      name: 'Standard Wash',
      description: 'Perfect for everyday clothes. Machine wash, machine dry, and professional folding.',
      price: '$5.00/kg',
      image: 'https://images.unsplash.com/photo-1582820529300-e3c99f60a85e?q=80&w=2070&auto=format&fit=crop',
      features: [
        'Machine wash in warm water',
        'Machine dry on appropriate heat',
        'Professional folding',
        'Scent-free detergent',
        'Ideal for cotton & blends',
      ],
      turnaround: '2-3 days',
      icon: 'Shirt',
    },
    {
      id: 'delicate',
      name: 'Delicate Fabrics',
      description: 'Gentle care for silk, satin, linen, and other delicate materials.',
      price: '$5.00/kg',
      image: 'https://images.unsplash.com/photo-1559062615-cd4628902d4a?q=80&w=2070&auto=format&fit=crop',
      features: [
        'Hand wash or delicate cycle',
        'Cold water with delicate detergent',
        'Gentle air dry',
        'Special hanging care',
        'Ideal for silk, satin, linen',
      ],
      turnaround: '3-4 days',
      icon: 'Sparkles',
    },
    {
      id: 'express',
      name: 'Express Service',
      description: 'Need your clothes fast? Same-day turnaround available.',
      price: '$10.00/kg',
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2070&auto=format&fit=crop',
      features: [
        'Rush processing',
        'Priority handling',
        'Same-day turnaround available',
        'Premium quality assured',
        'Perfect for urgent needs',
      ],
      turnaround: '4-6 hours',
      icon: Sparkles,
    },
    {
      id: 'comforter',
      name: 'Comforter & Bedding',
      description: 'Specialized cleaning for large items like comforters, duvets, and quilts.',
      price: '$6.00 per item',
      image: 'https://images.unsplash.com/photo-1567286951697-e80fcf6baf10?q=80&w=2070&auto=format&fit=crop',
      features: [
        'Industrial-sized machines',
        'Gentle wash for down & synthetic',
        'Plump dry cycle',
        'White glove folding & packaging',
        'Keeps fill full & fluffy',
      ],
      turnaround: '2-3 days',
      icon: Cloud,
    },
    {
      id: 'handwash',
      name: 'Hand Wash Premium',
      description: 'Ultimate care with hand washing for your most precious items.',
      price: '$5.00/kg',
      image: 'https://images.unsplash.com/photo-1546703388-bb4293fe3c61?q=80&w=2070&auto=format&fit=crop',
      features: [
        ' 100% hand washed',
        'Premium detergent only',
        'Individual attention',
        'Air dried on racks',
        'Best for luxury items',
      ],
      turnaround: '3-4 days',
      icon: Hand,
    },
    {
      id: 'stain',
      name: 'Stain Treatment',
      description: 'Expert stain removal. Add-on or standalone service.',
      price: '+$2.00 per item',
      image: 'https://images.unsplash.com/photo-1599027615110-f8881c627b0b?q=80&w=2070&auto=format&fit=crop',
      features: [
        'Professional stain analysis',
        'Pre-treat before washing',
        'Specialized treatment solutions',
        '85% stain removal guarantee',
        'Add to any service',
      ],
      turnaround: 'Included in service',
      icon: Droplet,
    },
  ]

  return (
    <>
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-mint to-white py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl sm:text-6xl font-bold text-dark mb-6">Services Tailored to You</h1>
          <p className="text-xl text-gray max-w-2xl mx-auto mb-8">
            From everyday basics to luxury garments, we have a service for every fabric and need.
          </p>
          <Link href="/booking">
            <Button size="lg" className="bg-primary text-white">Get Started Today</Button>
          </Link>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-dark text-center mb-12">Choose Your Service</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <Card key={service.id} hoverable className="overflow-hidden flex flex-col">
                <div className="relative h-48 overflow-hidden rounded-lg mb-4">
                  <Image
                    src={service.image}
                    alt={service.name}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-2xl font-bold text-dark mb-1">{service.name}</h3>
                      <p className="text-sm text-primary font-bold">{service.price}</p>
                    </div>
                    <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">{React.createElement(service.icon, { size: 24, className: 'text-primary' })}</span>
                  </div>
                  <p className="text-gray mb-4">{service.description}</p>
                  <ul className="mb-6 flex-1">
                    {service.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 mb-2 text-sm text-gray">
                        <CheckCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center gap-2 text-sm text-gray mb-4">
                    <Clock size={16} className="text-primary" />
                    <span>Turnaround: {service.turnaround}</span>
                  </div>
                  <Link href="/booking" className="w-full">
                    <Button variant="primary" className="w-full">Select Service</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Add-Ons Section */}
      <section className="section bg-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-dark text-center mb-12">Premium Add-Ons</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Stain Treatment', price: '+$2.00/item', desc: 'Professional stain removal' },
              { name: 'Delicate Dry', price: '+$1.50', desc: 'Air dry instead of machine' },
              { name: 'Scent Boost', price: '+$0.50', desc: 'Premium fragrance added' },
              { name: 'Hang Dry', price: '+$2.00/item', desc: 'Keep from dryer damage' },
              { name: 'Express Return', price: '+$3.00', desc: 'Next day delivery' },
              { name: 'Sweater Care', price: '+$1.00/item', desc: 'Hand dry flat' },
              { name: 'Premium Packaging', price: '+$1.50', desc: 'Luxury presentation' },
              { name: 'Wrinkle Free', price: '+$2.00', desc: 'Steam press included' },
            ].map((addon, i) => (
              <Card key={i} className="text-center">
                <h4 className="font-bold text-dark mb-1">{addon.name}</h4>
                <p className="text-sm text-primary font-bold mb-2">{addon.price}</p>
                <p className="text-xs text-gray">{addon.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Guarantees */}
      <section className="section bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-dark text-center mb-12">Our Guarantees</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield size={40} className="text-primary" />,
                title: 'Damage Protection',
                description: 'If any damage occurs, we replace the item at no cost. No questions asked.',
              },
              {
                icon: <Sparkles size={40} className="text-primary" />,
                title: 'Quality Promise',
                description: 'Not satisfied with quality? We re-wash for free or give you 100% back.',
              },
              {
                icon: <Users size={40} className="text-primary" />,
                title: 'Customer First',
                description: 'Your satisfaction is guaranteed. We stand behind every wash.',
              },
            ].map((guarantee, i) => (
              <Card key={i} className="text-center">
                <div className="flex justify-center mb-4">{guarantee.icon}</div>
                <h3 className="text-xl font-bold text-dark mb-3">{guarantee.title}</h3>
                <p className="text-gray">{guarantee.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary to-accent py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Try Our Services?</h2>
          <p className="text-lg text-white mb-8 opacity-90">Choose your service and schedule your first pickup today.</p>
          <Link href="/booking">
            <Button size="lg" className="bg-white text-primary font-bold">
              Book Now - First Pickup FREE
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </>
  )
}
