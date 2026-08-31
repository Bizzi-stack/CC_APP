import type { Metadata, Viewport } from 'next'
import './globals.css'
import { CartWishlistProvider } from '@/contexts/CartWishlistContext'
import { SpeedInsights } from '@vercel/speed-insights/next'
import ServiceWorkerRegistry from '@/components/ServiceWorkerRegistry'

export const metadata: Metadata = {
  title: 'College Clubs',
  description: 'College Clubs — sessions, matches, players, fantasy.',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  }
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
