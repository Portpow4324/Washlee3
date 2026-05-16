import type { MetadataRoute } from 'next'
import { cityLandingPages, serviceAreaSuburbs, slugifySuburb } from '@/lib/localLandingPages'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://washlee.com.au'

const routes = [
  '/',
  '/pricing',
  '/how-it-works',
  '/services',
  '/mobile-app',
  '/wash-club',
  '/pro',
  '/about',
  '/faq',
  '/help-center',
  '/contact',
  '/care-guide',
  '/damage-protection',
  '/protection-plan',
  '/business',
  '/gift-cards',
  '/privacy-policy',
  '/terms-of-service',
  '/cookie-policy',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const localRoutes = [
    ...cityLandingPages.map((page) => `/${page.slug}`),
    '/service-areas',
    ...serviceAreaSuburbs.map((suburb) => `/service-areas/${slugifySuburb(suburb)}`),
  ]

  return [...routes, ...localRoutes].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : route === '/pricing' || route.includes('melbourne') ? 0.9 : 0.7,
  }))
}
