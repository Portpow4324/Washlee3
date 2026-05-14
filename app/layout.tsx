import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import CookieBanner from '@/components/CookieBanner'
import { AuthProvider } from '@/lib/AuthContext'
import { AdminSessionProvider } from '@/lib/adminSessionContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import ErrorTrackingBoot from '@/components/ErrorTrackingBoot'
import Script from 'next/script'
import WashleeAnalyticsTracker from '@/components/analytics/WashleeAnalyticsTracker'
import MarketingPixels from '@/components/analytics/MarketingPixels'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://washlee.com.au'
const siteName = 'Washlee'
const siteDescription =
  'Book laundry pickup and delivery across Melbourne. Standard wash & fold is $7.50/kg, express same-day is $12.50/kg, with a $75 minimum order.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Washlee | Laundry pickup and delivery in Melbourne',
    template: '%s | Washlee',
  },
  description: siteDescription,
  applicationName: siteName,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    siteName,
    title: 'Washlee | Laundry pickup and delivery in Melbourne',
    description: siteDescription,
    locale: 'en_AU',
    images: [
      {
        url: '/logo-washlee.png',
        width: 1200,
        height: 630,
        alt: 'Washlee laundry pickup and delivery in Melbourne',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Washlee | Laundry pickup and delivery in Melbourne',
    description: siteDescription,
    images: ['/logo-washlee.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: '#48C9B0',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'LaundryService'],
    name: siteName,
    url: siteUrl,
    description: siteDescription,
    areaServed: {
      '@type': 'City',
      name: 'Melbourne',
      addressCountry: 'AU',
    },
    priceRange: '$$',
    sameAs: [siteUrl],
    offers: [
      {
        '@type': 'Offer',
        name: 'Standard wash & fold',
        price: '7.50',
        priceCurrency: 'AUD',
        unitText: 'kg',
      },
      {
        '@type': 'Offer',
        name: 'Express same-day laundry',
        price: '12.50',
        priceCurrency: 'AUD',
        unitText: 'kg',
      },
    ],
  }

  return (
    <html lang="en" data-scroll-behavior="smooth" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {googleMapsApiKey && (
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}`}
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className="bg-white text-dark font-sans antialiased">
        <ErrorBoundary>
          <AuthProvider>
            <AdminSessionProvider>
              <ErrorTrackingBoot />
              <WashleeAnalyticsTracker />
              <MarketingPixels />
              {children}
              <CookieBanner />
            </AdminSessionProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
