import type { Metadata, Viewport } from 'next'
import './globals.css'
import { CartWishlistProvider } from '@/contexts/CartWishlistContext'
import { SpeedInsights } from '@vercel/speed-insights/next'
import ServiceWorkerRegistry from '@/components/ServiceWorkerRegistry'

export const metadata: Metadata = {
  title: 'THE CIRCLE FC',
  description: 'Private football community — sessions, matches, players.',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegistry />
        <CartWishlistProvider>
          {children}
        </CartWishlistProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
