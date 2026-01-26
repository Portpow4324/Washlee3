'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Card from '@/components/Card'
import Button from '@/components/Button'
import { Briefcase, Users, Heart, Zap, MapPin, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default function Careers() {
  const openPositions = [
    {
      title: "Senior Full-Stack Developer",
      location: "Remote",
      type: "Full-time",
      salary: "$120K - $160K",
      description: "Help us build the next generation of laundry technology. We're looking for experienced developers to join our growing team."
    },
    {
      title: "Customer Success Manager",
      location: "Headquarters",
      type: "Full-time",
      salary: "$70K - $90K",
      description: "Be the voice of our customers. Help us build lasting relationships and ensure customer satisfaction."
    },
    {
      title: "Operations Coordinator",
      location: "Headquarters",
      type: "Full-time",
      salary: "$55K - $70K",
      description: "Optimize our daily operations. Manage logistics, schedules, and ensure seamless service delivery."
    },
    {
      title: "Marketing Specialist",
      location: "Remote",
      type: "Full-time",
      salary: "$65K - $85K",
      description: "Tell our story. Create compelling campaigns that connect with our customers and grow our brand."
    },
    {
      title: "Mobile App Developer",
      location: "Remote",
      type: "Full-time",
      salary: "$110K - $150K",
      description: "Build mobile experiences. Develop iOS and Android apps that our customers love."
    },
    {
      title: "Facility Manager",
      location: "Headquarters",
      type: "Full-time",
      salary: "$60K - $80K",
      description: "Manage our cleaning facility. Ensure quality standards and optimize our cleaning operations."
    },
  ]

  const whyJoinUs = [
    {
      icon: Heart,
      title: "Meaningful Work",
      description: "Join a mission-driven company solving real problems in people's lives."
    },
    {
      icon: Users,
      title: "Amazing Team",
      description: "Work with talented, passionate people who are excited about what we do."
    },
    {
      icon: Zap,
      title: "Growth Opportunities",
      description: "We invest in our team's development with training, mentorship, and career paths."
    },
    {
      icon: DollarSign,
      title: "Competitive Benefits",
      description: "Competitive salary, health insurance, 401k matching, and unlimited PTO."
    },
  ]

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-mint to-white py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h1 className="text-5xl md:text-6xl font-bold text-dark mb-6">Join The Washlee Team</h1>
            <p className="text-xl text-gray max-w-2xl">
              We're building the future of laundry services. Be part of something special.
            </p>
          </div>
        </section>

        {/* Why Join Us */}
        <section className="py-20 max-w-6xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-dark mb-12 text-center">Why Join Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            {whyJoinUs.map((item, index) => {
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

          {/* Benefits */}
          <div className="bg-primary text-white rounded-2xl p-12 mb-20">
            <h2 className="text-3xl font-bold mb-8 text-center">Our Benefits Package</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold mb-2">🏥</div>
                <p className="font-semibold">Health Insurance</p>
                <p className="text-mint text-sm">Medical, dental & vision</p>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">📈</div>
                <p className="font-semibold">401(k) Matching</p>
                <p className="text-mint text-sm">Up to 5% match</p>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">✈️</div>
                <p className="font-semibold">Unlimited PTO</p>
                <p className="text-mint text-sm">Work-life balance matters</p>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">💰</div>
                <p className="font-semibold">Competitive Salary</p>
                <p className="text-mint text-sm">Industry-leading pay</p>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">🚀</div>
                <p className="font-semibold">Growth Training</p>
                <p className="text-mint text-sm">Professional development</p>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">🎉</div>
                <p className="font-semibold">Team Events</p>
                <p className="text-mint text-sm">Regular celebrations</p>
              </div>
            </div>
          </div>

          {/* Open Positions */}
          <div>
            <h2 className="text-4xl font-bold text-dark mb-12 text-center">Open Positions</h2>
            <div className="space-y-6">
              {openPositions.map((position, index) => (
                <Card key={index} className="p-8 hover:shadow-lg transition">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-dark">{position.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-gray">
                        <div className="flex items-center gap-1">
                          <MapPin size={16} />
                          {position.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase size={16} />
                          {position.type}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign size={16} />
                          {position.salary}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray mb-6">{position.description}</p>
                  <Button size="sm">View & Apply</Button>
                </Card>
              ))}
            </div>

            {/* Apply Section */}
            <div className="mt-16 text-center">
              <h3 className="text-2xl font-bold text-dark mb-4">Don't see your role?</h3>
              <p className="text-gray mb-6 max-w-2xl mx-auto">
                We're always looking for talented, passionate people. Send us your resume and tell us what you'd like to do at Washlee.
              </p>
              <Button size="lg" className="text-white">View All Opportunities</Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
