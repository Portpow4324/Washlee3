'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'

interface RevealProps {
  children: ReactNode
  /** Delay before animation begins (seconds) */
  delay?: number
  /** Optional Tailwind class overrides for the wrapper */
  className?: string
  /** Animation variant */
  as?: 'up' | 'fade' | 'right'
}

/**
 * Wrap content in a scroll-reveal that triggers once the wrapper enters the
 * viewport. Respects prefers-reduced-motion via the global CSS rule already
 * defined in globals.css (animation-duration is forced to 0.01ms).
 */
export default function Reveal({ children, delay = 0, className = '', as = 'up' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const el = ref.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true)
            obs.disconnect()
            break
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const baseHidden =
    as === 'right'
      ? 'opacity-0 translate-x-3'
      : as === 'fade'
        ? 'opacity-0'
        : 'opacity-0 translate-y-3'

  const baseShown =
    as === 'right'
      ? 'opacity-100 translate-x-0'
      : as === 'fade'
        ? 'opacity-100'
        : 'opacity-100 translate-y-0'

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}s` }}
      className={`transition-all duration-700 ease-out ${shown ? baseShown : baseHidden} ${className}`}
    >
      {children}
    </div>
  )
}
