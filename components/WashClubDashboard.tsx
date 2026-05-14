'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Link from 'next/link'
import { Gift } from 'lucide-react'

export default function WashClubDashboard() {
  const { user, loading: authLoading } = useAuth()

  if (authLoading) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 bg-primary rounded-full animate-pulse mb-4"></div>
          <p className="text-dark font-semibold">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray mb-4">Please log in to view your Wash Club membership</p>
        <Link href="/auth/login" className="text-primary hover:text-opacity-80">Login</Link>
      </div>
    )
  }

  return (
    <Card>
      <div className="p-8 text-center">
        <Gift size={48} className="mx-auto text-primary mb-4" />
        <h2 className="text-2xl font-bold text-dark mb-2">Wash Club Rewards</h2>
        <p className="text-gray mb-6">
          Wash Club is free loyalty. Earn points on completed Washlee orders and track your reward progress from the member dashboard.
        </p>
        <Link href="/dashboard/washclub">
          <Button className="bg-primary text-white">View rewards</Button>
        </Link>
      </div>
    </Card>
  )
}
