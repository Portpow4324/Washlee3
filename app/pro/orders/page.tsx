'use client'
import Link from 'next/link'
export default function ProOrdersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7fefe] to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-[#1f2d2b] mb-4">My Orders</h1>
        <p className="text-[#6b7b78] mb-6">Order history coming soon</p>
        <Link href="/" className="text-[#48C9B0] hover:text-[#7FE3D3]">← Home</Link>
      </div>
    </div>
  )
}
