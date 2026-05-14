'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import {
  buildUrlWithAttribution,
  captureAttributionFromUrl,
  trackWashleeEvent,
} from '@/lib/analytics/client'

function eventForHref(href: string | null) {
  if (!href) return null
  if (href.includes('apps.apple.com')) return 'app_store_clicked'
  if (href.includes('play.google.com')) return 'play_store_clicked'
  if (href.includes('/auth/signup')) return 'customer_signup_started'
  if (href.includes('/auth/signin') || href.includes('/auth/login') || href.includes('/admin/login')) return 'login_started'
  if (href.includes('/checkout')) return 'checkout_started'
  if (href.includes('/booking')) return 'booking_started'
  if (href.includes('/pricing')) return 'pricing_viewed'
  if (href.includes('/faq')) return 'faq_viewed'
  if (href.includes('/contact')) return 'contact_viewed'
  if (href.includes('/wash-club')) return 'wash_club_viewed'
  if (href.includes('/pro')) return 'pro_landing_viewed'
  if (href.includes('/mobile-app')) return 'app_handoff_clicked'
  return null
}

export default function WashleeAnalyticsTracker() {
  const pathname = usePathname()
  const { user } = useAuth()
  const lastPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname || lastPathRef.current === pathname) return
    lastPathRef.current = pathname
    captureAttributionFromUrl()

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
      if (clickable instanceof HTMLAnchorElement && href) {
        const attributedHref = buildUrlWithAttribution(href)
        if (attributedHref && attributedHref !== href) {
          clickable.setAttribute('href', attributedHref)
        }
      }
      const inferredEvent = eventForHref(href)
      const eventName = explicitEvent || inferredEvent
      if (!eventName) return

      trackWashleeEvent(eventName, {
        userId: user?.id || null,
        metadata: {
          cta_label:
            clickable.getAttribute('data-analytics-label') ||
            clickable.textContent?.trim().replace(/\s+/g, ' ').slice(0, 80) ||
            href ||
            'button',
          route: window.location.pathname,
          target_href: href || '',
        },
      })
    }

    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [user?.id])

  return null
}
