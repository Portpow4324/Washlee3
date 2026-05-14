import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://washlee.com.au'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin-login',
          '/admin-setup',
          '/api',
          '/auth/callback',
          '/auth/verify-email',
          '/auth/verify-email-code',
          '/checkout',
          '/dashboard',
          '/email-debug',
          '/employee',
          '/notifications',
          '/payment-success',
          '/refund-payment',
          '/secret-admin',
          '/test-remember-me',
          '/tracking',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
