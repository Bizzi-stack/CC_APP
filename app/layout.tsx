import type { Metadata, Viewport } from 'next'
import './globals.css'
import { CartWishlistProvider } from '@/contexts/CartWishlistContext'
import { SpeedInsights } from '@vercel/speed-insights/next'

export const metadata: Metadata = {
  title: 'THE CIRCLE FC',
  description: 'Private football community — sessions, matches, players.',
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
        <CartWishlistProvider>
          {children}
        </CartWishlistProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
