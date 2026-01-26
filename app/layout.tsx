import type { Metadata } from 'next'
import './globals.css'
import CookieBanner from '@/components/CookieBanner'
import { AuthProvider } from '@/lib/AuthContext'

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
    <html lang="en">
      <body className="bg-white text-dark font-sans">
        <AuthProvider>
          {children}
          <CookieBanner />
        </AuthProvider>
      </body>
    </html>
  )
}
