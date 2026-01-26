'use client'

import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hoverable?: boolean
}

export default function Card({ children, className = '', hoverable = false }: CardProps) {
  return (
    <div
      className={`bg-light rounded-xl p-6 ${hoverable ? 'hover:shadow-lg transition' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
