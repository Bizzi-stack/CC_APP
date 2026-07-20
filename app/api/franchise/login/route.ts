import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const { franchiseId, passcode } = await request.json()

    if (!franchiseId || !passcode) {
      return NextResponse.json({ error: 'Franchise and passcode are required' }, { status: 400 })
    }

    // Verify passcode against DB
    const { data: franchise, error } = await supabase
      .from('franchises')
      .select('*')
      .eq('id', franchiseId)
      .single()

    if (error || !franchise) {
      return NextResponse.json({ error: 'Franchise not found' }, { status: 404 })
    }

    if (franchise.passcode !== passcode) {
      return NextResponse.json({ error: 'Invalid passcode' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true, franchise })

    // Set secure HTTP-only cookie for franchise owner
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    }

    response.cookies.set({ name: 'franchise_token', value: franchiseId, ...cookieOptions })

    return response
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
