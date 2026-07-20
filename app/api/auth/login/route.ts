import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (password === '0000') {
      const response = NextResponse.json({ success: true, role: 'admin' })
      
      // Set secure HTTP-only cookies for both admin and community
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      }
      
      response.cookies.set({ name: 'admin_token', value: 'authenticated', ...cookieOptions })
      response.cookies.set({ name: 'community_token', value: 'authenticated', ...cookieOptions })

      return response
    }

    if (password === 'TheCircle2026') {
      const response = NextResponse.json({ success: true, role: 'community' })
      
      // Set secure HTTP-only cookie for community
      response.cookies.set({
        name: 'community_token',
        value: 'authenticated',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      })

      return response
    }

    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
