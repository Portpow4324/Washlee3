'use client'

import { ReactNode } from 'react'

type ButtonVariant = 'primary' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  [key: string]: any
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'font-semibold transition rounded-full cursor-pointer border-none shadow-md hover:shadow-xl'
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-accent hover:shadow-xl',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white hover:shadow-xl',
    ghost: 'text-primary hover:bg-mint hover:shadow-xl',
  }

  const sizeClasses = {
    sm: 'px-4 py-2 text-base',
    md: 'px-6 py-3 text-lg',
    lg: 'px-8 py-4 text-xl',
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
