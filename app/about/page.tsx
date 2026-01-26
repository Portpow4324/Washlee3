'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { Users, Heart, Zap, Globe, Award, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-mint to-white py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h1 className="text-5xl md:text-6xl font-bold text-dark mb-6">About Washlee</h1>
            <p className="text-xl text-gray max-w-2xl">
              We're on a mission to free people from the burden of laundry so they can focus on what truly matters.
            </p>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-20 max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h2 className="text-4xl font-bold text-dark mb-6">Our Story</h2>
              <p className="text-gray text-lg mb-4">
                Washlee was born from a simple observation: people are busier than ever, and laundry is one of life's most tedious chores.
              </p>
              <p className="text-gray text-lg mb-4">
                In 2023, our founder realized that laundry services were either non-existent or outdated. They imagined a world where professional laundry care was as accessible as ordering a ride or food.
              </p>
              <p className="text-gray text-lg">
                Today, Washlee is the trusted laundry partner for thousands of customers across the region, picking up, cleaning, and delivering fresh clothes with care.
              </p>
            </div>
            <div className="bg-accent rounded-2xl h-96 overflow-hidden shadow-lg">
              <img
                src="https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=2070&auto=format&fit=crop"
                alt="Washlee team"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Mission & Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <Card className="p-8">
              <Heart size={40} className="text-primary mb-4" />
              <h3 className="text-2xl font-bold text-dark mb-3">Our Mission</h3>
              <p className="text-gray">
                To make professional laundry care accessible, affordable, and exceptional for everyone.
              </p>
            </Card>
            <Card className="p-8">
              <Zap size={40} className="text-primary mb-4" />
              <h3 className="text-2xl font-bold text-dark mb-3">Our Values</h3>
              <ul className="text-gray space-y-2">
                <li>✓ Reliability & Trust</li>
                <li>✓ Quality & Care</li>
                <li>✓ Innovation & Simplicity</li>
              </ul>
            </Card>
            <Card className="p-8">
              <Globe size={40} className="text-primary mb-4" />
              <h3 className="text-2xl font-bold text-dark mb-3">Our Vision</h3>
              <p className="text-gray">
                To be the most trusted and innovative laundry service, transforming how people manage their wardrobes.
              </p>
            </Card>
          </div>

          {/* Key Stats */}
          <div className="bg-primary text-white rounded-2xl p-12 mb-20">
            <h2 className="text-3xl font-bold mb-12 text-center">By The Numbers</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">50K+</div>
                <p className="text-mint">Happy Customers</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">1M+</div>
                <p className="text-mint">Garments Cleaned</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">4.9★</div>
                <p className="text-mint">Average Rating</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">2K+</div>
                <p className="text-mint">Washlee Pros</p>
              </div>
            </div>
          </div>

          {/* Why Choose Washlee */}
          <div className="mb-20">
            <h2 className="text-4xl font-bold text-dark mb-12 text-center">Why Choose Washlee</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  icon: Award,
                  title: "Expert Care",
                  description: "Every item is treated with professional care using quality detergents and proven techniques."
                },
                {
                  icon: Zap,
                  title: "Fast Turnaround",
                  description: "Standard delivery in 24 hours. Same-day options available in select areas."
                },
                {
                  icon: Users,
                  title: "Trusted Pros",
                  description: "All our Washlee Pros are background-checked, trained, and insured for your peace of mind."
                },
                {
                  icon: TrendingUp,
                  title: "Eco-Friendly",
                  description: "We use sustainable practices and eco-friendly detergents to care for your clothes and the planet."
                },
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <Card key={index} className="p-8">
                    <Icon size={40} className="text-primary mb-4" />
                    <h3 className="text-2xl font-bold text-dark mb-3">{item.title}</h3>
                    <p className="text-gray">{item.description}</p>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Team */}
          <div className="mb-20">
            <h2 className="text-4xl font-bold text-dark mb-12 text-center">Meet The Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah Johnson",
                  role: "Founder & CEO",
                  image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=500&auto=format&fit=crop"
                },
                {
                  name: "Michael Chen",
                  role: "COO",
                  image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=500&auto=format&fit=crop"
                },
                {
                  name: "Emma Davis",
                  role: "Head of Operations",
                  image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=500&auto=format&fit=crop"
                },
              ].map((member, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="h-64 overflow-hidden">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-dark">{member.name}</h3>
                    <p className="text-primary font-semibold">{member.role}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-dark mb-6">Ready to Experience Washlee?</h2>
            <Link href="/booking">
              <Button size="lg" className="text-white">Book Your First Order</Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
