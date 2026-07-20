import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const { playerId, passcode } = await request.json()

    if (!playerId || !passcode) {
      return NextResponse.json({ error: 'Player ID and passcode are required' }, { status: 400 })
    }

    const { data: player, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single()

    if (error || !player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    if (player.status !== 'active') {
      return NextResponse.json({ error: 'Player account is not active' }, { status: 403 })
    }

    if (player.passcode !== passcode) {
      return NextResponse.json({ error: 'Incorrect passcode' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true, name: player.name })
    
    // Set cookie: player_token
    response.cookies.set('player_token', player.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
