'use client'

import { Lock } from 'lucide-react'

interface LockedUIDDisplayProps {
  uid: string
  firstName?: string
}

export default function LockedUIDDisplay({ uid, firstName }: LockedUIDDisplayProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-mint/20 border border-primary/20 rounded-lg">
      <Lock size={18} className="text-primary" />
      <div>
        <p className="text-xs text-gray font-medium">Secure ID</p>
        <p className="font-mono text-sm text-dark">••••••••{uid?.slice(-4) || '****'}</p>
      </div>
    </div>
  )
}
