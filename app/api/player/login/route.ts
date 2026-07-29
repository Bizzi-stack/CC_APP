import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { playerId, playerName, passcode } = await request.json()

    if ((!playerId && !playerName) || !passcode) {
      return NextResponse.json({ error: 'Player name/ID and passcode are required' }, { status: 400 })
    }

    let query = supabase.from('players').select('*')
    if (playerId) {
      query = query.eq('id', playerId)
    } else if (playerName) {
      query = query.ilike('name', playerName.trim())
    }

    const { data: players, error } = await query

    if (error || !players || players.length === 0) {
      return NextResponse.json({ error: 'Player not found. Check name or contact admin.' }, { status: 404 })
    }

    const player = players[0]

    if (player.status && player.status !== 'active') {
      return NextResponse.json({ error: 'Player account is not active' }, { status: 403 })
    }

    if (player.passcode !== passcode) {
      return NextResponse.json({ error: 'Incorrect passcode' }, { status: 401 })
    }

    const response = NextResponse.json({
      success: true,
      player: {
        id: player.id,
        name: player.name,
        photo_url: player.photo_url,
        position: player.position
      }
    })
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 365 // 1 Year Persistent Login (Instagram-style)
    }

    // Set cookies for both player_token and community_token
    response.cookies.set({ name: 'player_token', value: player.id, ...cookieOptions })
    response.cookies.set({ name: 'community_token', value: 'authenticated', ...cookieOptions })

    return response
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 })
  }
}
