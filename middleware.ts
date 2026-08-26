import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require admin authentication to view
const adminUIRoutes = [
  '/players',
  '/franchises',
  '/sessions'
]

// Routes that require at least community/player authentication to view
const communityUIRoutes = [
  '/home',
  '/market',
  '/calendar',
  '/player-portal'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasAdminToken = request.cookies.has('admin_token')
  const hasPlayerToken = request.cookies.has('player_token')
  const hasCommunityToken = request.cookies.has('community_token') || hasPlayerToken

  // Check Admin UI routes
  const isAdminUI = adminUIRoutes.some(route => pathname.startsWith(route))
  if (isAdminUI && !hasAdminToken) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Check Community UI routes
  const isCommunityUI = communityUIRoutes.some(route => pathname.startsWith(route))
  if (isCommunityUI && !hasCommunityToken && !hasAdminToken) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Check Franchise Portal protection (requires franchise_token)
  if (pathname.startsWith('/franchise-portal') && !request.cookies.has('franchise_token')) {
    const url = request.nextUrl.clone()
    url.pathname = '/franchise-login'
    return NextResponse.redirect(url)
  }

  // Check Player Portal protection (requires player_token)
  if (pathname.startsWith('/player-portal') && !hasPlayerToken) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Check Admin API routes for POST/PATCH/DELETE (excluding player signup)
  const isAdminApi = (
    pathname === '/api/players' ||
    pathname.startsWith('/api/players/') ||
    pathname === '/api/franchises' ||
    pathname.startsWith('/api/franchises/') ||
    (pathname === '/api/sessions' && !pathname.startsWith('/api/sessions/signup'))
  )
  const isMutatingRequest = ['POST', 'PATCH', 'DELETE'].includes(request.method)
  
  if (isAdminApi && isMutatingRequest && !hasAdminToken) {
    return NextResponse.json(
      { error: 'Unauthorized. Admin access required.' },
      { status: 401 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/home/:path*',
    '/market/:path*',
    '/calendar/:path*',
    '/players/:path*',
    '/franchises/:path*',
    '/sessions/:path*',
    '/player-portal/:path*',
    '/api/:path*',
  ],
}
