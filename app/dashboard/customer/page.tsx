'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Spinner from '@/components/Spinner'
import { Package, ClipboardList, Settings, LogOut, ArrowRight } from 'lucide-react'
import { useEffect } from 'react'

export default function CustomerDashboard() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const handleLogout = async () => {
    const { useAuth } = await import('@/lib/AuthContext')
    // Logout is typically handled by the AuthContext
    // For now, just redirect to login
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Spinner />
        </div>
        <Footer />
      </>
    )
  }

  if (!user) return null

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-[#E8FFFB] to-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-dark mb-2">Welcome, {user.email?.split('@')[0]}</h1>
            <p className="text-gray">Manage your laundry orders and preferences</p>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* My Orders */}
            <Link href="/dashboard/customer/orders">
              <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/40 h-full cursor-pointer hover:shadow-lg transition">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                    <Package size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-dark">My Orders</h3>
                    <p className="text-gray text-sm">View, track, and manage your orders</p>
                  </div>
                  <div className="flex items-center gap-2 text-primary text-sm font-semibold">
                    View Orders
                    <ArrowRight size={16} />
                  </div>
                </div>
              </Card>
            </Link>

            {/* Preferences */}
            <Link href="/dashboard/customer/preferences">
              <Card className="bg-gradient-to-br from-accent/10 to-primary/10 border-accent/40 h-full cursor-pointer hover:shadow-lg transition">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center">
                    <Settings size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-dark">Preferences</h3>
                    <p className="text-gray text-sm">Set default laundry preferences</p>
                  </div>
                  <div className="flex items-center gap-2 text-accent text-sm font-semibold">
                    Manage Preferences
                    <ArrowRight size={16} />
                  </div>
                </div>
              </Card>
            </Link>
          </div>

          {/* Info Section */}
          <Card className="mb-8">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-dark">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray text-sm">Email</p>
                  <p className="text-dark font-semibold">{user.email}</p>
                </div>
                <div>
                  <p className="text-gray text-sm">Account Type</p>
                  <p className="text-dark font-semibold">Customer</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Logout Button */}
          <div className="text-center">
            <Button
              onClick={() => {
                // Call logout from auth context
                window.location.href = '/auth/logout'
              }}
              className="bg-red-500 hover:bg-red-600 flex items-center justify-center gap-2 mx-auto"
            >
              <LogOut size={18} />
              Sign Out
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
