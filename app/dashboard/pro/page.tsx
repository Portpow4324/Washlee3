'use client'

import { useAuth } from '@/lib/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { Briefcase, DollarSign, Clock, TrendingUp, LogOut, Star, FileText, Settings } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function ProDashboard() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('jobs')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-teal rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-light flex flex-col">
      <Header />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-dark mb-2">Welcome, {userData?.name || 'Pro'}!</h1>
            <p className="text-gray">Manage your jobs and earnings</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card hoverable className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray text-sm mb-1">This Week</p>
                <p className="text-3xl font-bold text-dark">$487</p>
              </div>
              <DollarSign size={32} className="text-teal" />
            </div>
          </Card>
          <Card hoverable className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray text-sm mb-1">Rating</p>
                <p className="text-3xl font-bold text-dark">4.98</p>
              </div>
              <Star size={32} className="text-teal" />
            </div>
          </Card>
          <Card hoverable className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray text-sm mb-1">Jobs Completed</p>
                <p className="text-3xl font-bold text-dark">234</p>
              </div>
              <Briefcase size={32} className="text-teal" />
            </div>
          </Card>
          <Card hoverable className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray text-sm mb-1">Growth</p>
                <p className="text-3xl font-bold text-dark">+12%</p>
              </div>
              <TrendingUp size={32} className="text-teal" />
            </div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="flex border-b border-gray">
            {[
              { id: 'jobs', label: 'Available Jobs', icon: Briefcase },
              { id: 'earnings', label: 'Earnings', icon: DollarSign },
              { id: 'account', label: 'Account', icon: FileText },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex-1 px-6 py-4 font-semibold transition flex items-center justify-center gap-2 ${
                  activeTab === id
                    ? 'text-primary border-b-2 border-primary bg-mint bg-opacity-30'
                    : 'text-gray hover:text-dark'
                }`}
              >
                <Icon size={20} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {/* Jobs Tab */}
            {activeTab === 'jobs' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-dark">Available Jobs</h2>
                  <Button>Refresh Jobs</Button>
                </div>
                <div className="space-y-4">
                  {[
                    {
                      id: 'JOB-501',
                      customer: 'Sarah Mitchell',
                      weight: '6 kg',
                      rate: '$18.00',
                      pickupTime: 'Today 4:00 PM',
                      distance: '2.3 km away',
                    },
                    {
                      id: 'JOB-502',
                      customer: 'John Davis',
                      weight: '8 kg',
                      rate: '$24.00',
                      pickupTime: 'Tomorrow 2:00 PM',
                      distance: '1.8 km away',
                    },
                  ].map((job) => (
                    <Card key={job.id} hoverable className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-semibold text-dark">{job.id}</p>
                          <p className="text-sm text-gray">{job.customer}</p>
                        </div>
                        <span className="px-3 py-1 bg-mint rounded-full text-sm font-semibold text-teal">{job.rate}</span>
                      </div>
                      <div className="flex gap-4 mb-4 text-sm text-gray">
                        <span>{job.weight}</span>
                        <span>•</span>
                        <span>{job.distance}</span>
                      </div>
                      <Button className="w-full">Accept Job</Button>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Earnings Tab */}
            {activeTab === 'earnings' && (
              <div>
                <h2 className="text-2xl font-bold text-dark mb-6">Earnings & Payouts</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card className="p-6 bg-gradient-to-br from-primary to-accent">
                    <p className="text-white text-sm mb-2 opacity-90">This Week Earnings</p>
                    <p className="text-4xl font-bold text-white">$487.50</p>
                  </Card>
                  <Card className="p-6">
                    <p className="text-gray text-sm mb-2">Total Earnings (All Time)</p>
                    <p className="text-3xl font-bold text-dark">$12,348</p>
                  </Card>
                  <Card className="p-6">
                    <p className="text-gray text-sm mb-2">Pending Payout</p>
                    <p className="text-3xl font-bold text-dark">$234.75</p>
                  </Card>
                </div>
                <h3 className="text-xl font-bold text-dark mb-4">Recent Payouts</h3>
                <div className="space-y-2">
                  {[
                    { date: 'Jan 15, 2026', amount: '$487.50' },
                    { date: 'Jan 8, 2026', amount: '$562.00' },
                    { date: 'Jan 1, 2026', amount: '$445.25' },
                  ].map((payout, i) => (
                    <Card key={i} className="p-4 flex justify-between items-center">
                      <span className="text-gray">{payout.date}</span>
                      <span className="font-bold text-dark">{payout.amount}</span>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div>
                <h2 className="text-2xl font-bold text-dark mb-6">Account Information</h2>
                <Card className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-sm text-gray mb-2">Full Name</p>
                      <p className="text-lg font-semibold text-dark">{userData?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray mb-2">Email</p>
                      <p className="text-lg font-semibold text-dark">{userData?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray mb-2">Phone</p>
                      <p className="text-lg font-semibold text-dark">{userData?.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray mb-2">Account Type</p>
                      <p className="text-lg font-semibold text-dark capitalize">{userData?.userType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray mb-2">Usage</p>
                      <p className="text-lg font-semibold text-dark capitalize">{userData?.personalUse || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray mb-2">Account Created</p>
                      <p className="text-lg font-semibold text-dark">
                        {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-2xl font-bold text-dark mb-6">Notification Settings</h2>
                <div className="space-y-4">
                  <Card className="p-6">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>
                        <p className="font-semibold text-dark">Job Alerts</p>
                        <p className="text-sm text-gray">Get notified about new jobs</p>
                      </span>
                      <input type="checkbox" defaultChecked className="w-5 h-5" />
                    </label>
                  </Card>
                  <Card className="p-6">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>
                        <p className="font-semibold text-dark">Earnings Updates</p>
                        <p className="text-sm text-gray">Weekly earnings summaries</p>
                      </span>
                      <input type="checkbox" defaultChecked={userData?.accountTexts} className="w-5 h-5" />
                    </label>
                  </Card>
                  <Card className="p-6">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span>
                        <p className="font-semibold text-dark">Marketing Messages</p>
                        <p className="text-sm text-gray">Promotions and special offers</p>
                      </span>
                      <input type="checkbox" defaultChecked={userData?.marketingTexts} className="w-5 h-5" />
                    </label>
                  </Card>
                </div>
                <Button className="mt-8">Save Preferences</Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
