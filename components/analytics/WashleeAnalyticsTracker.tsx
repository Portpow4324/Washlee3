'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { trackWashleeEvent } from '@/lib/analytics/client'

function eventForHref(href: string | null) {
  if (!href) return null
  if (href.includes('/auth/signup')) return 'signup_started'
  if (href.includes('/auth/signin') || href.includes('/admin/login')) return 'login_started'
  if (href.includes('/booking') || href.includes('/checkout')) return 'booking_started'
  return null
}

export default function WashleeAnalyticsTracker() {
  const pathname = usePathname()
  const { user } = useAuth()
  const lastPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname || lastPathRef.current === pathname) return
    lastPathRef.current = pathname

    trackWashleeEvent('page_view', {
      userId: user?.id || null,
      metadata: { route: pathname },
    })
  }, [pathname, user?.id])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const clickable = target.closest('a,button')
      if (!clickable) return

      const explicitEvent = clickable.getAttribute('data-analytics-event')
      const href = clickable instanceof HTMLAnchorElement ? clickable.getAttribute('href') : null
      const inferredEvent = eventForHref(href)
      const eventName = explicitEvent || inferredEvent
      if (!eventName) return

      trackWashleeEvent(eventName, {
        userId: user?.id || null,
        metadata: {
          cta: clickable.getAttribute('data-analytics-label') || href || 'button',
          route: window.location.pathname,
        },
      })
    }

    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [user?.id])

  return null
}
