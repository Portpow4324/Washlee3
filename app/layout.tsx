import type { Metadata } from 'next'
import './globals.css'
import CookieBanner from '@/components/CookieBanner'
import { AuthProvider } from '@/lib/AuthContext'
import { AdminSessionProvider } from '@/lib/adminSessionContext'
import ErrorBoundary from '@/components/ErrorBoundary'

export const metadata: Metadata = {
  title: 'Washlee - Laundry Done for You',
  description: 'Get your laundry picked up, cleaned, and delivered by trusted local professionals.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="bg-white text-dark font-sans">
        <ErrorBoundary>
          <AuthProvider>
            <AdminSessionProvider>
              {children}
              <CookieBanner />
            </AdminSessionProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
