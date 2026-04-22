'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, X } from 'lucide-react'

interface ToastProps {
  message: string
  type: 'success' | 'error' | 'info'
  duration?: number
  onClose?: () => void
}

export default function Toast({ message, type, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  const bgColor = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
  }[type]

  const textColor = {
    success: 'text-green-700',
    error: 'text-red-700',
    info: 'text-blue-700',
  }[type]

  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : AlertCircle

  return (
    <div className={`fixed top-4 right-4 flex items-center gap-3 px-4 py-3 rounded-lg border ${bgColor} shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-300`}>
      <Icon size={20} className={textColor} />
      <p className={`text-sm font-medium ${textColor}`}>{message}</p>
      <button
        onClick={() => setIsVisible(false)}
        className={`ml-2 ${textColor} hover:opacity-70 transition`}
      >
        <X size={18} />
      </button>
    </div>
  )
}
