import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json({ error: 'session_id is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('session_signups')
    .select('*, player:players(*)')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ signups: data || [] })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { session_id, player_id, selected_team } = body

    // Try player token from cookie if player_id is not passed
    const cookiePlayerId = request.cookies.get('player_token')?.value
    const finalPlayerId = player_id || cookiePlayerId

    if (!session_id || !finalPlayerId) {
      return NextResponse.json({ error: 'session_id and player authentication required' }, { status: 400 })
    }

    // Upsert signup
    const { data, error } = await supabase
      .from('session_signups')
      .upsert(
        {
          session_id,
          player_id: finalPlayerId,
          selected_team: selected_team || 'Red Team',
          created_at: new Date().toISOString()
        },
        { onConflict: 'session_id,player_id' }
      )
      .select('*, player:players(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, signup: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Signup failed' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')
  const playerId = searchParams.get('player_id') || request.cookies.get('player_token')?.value

  if (!sessionId || !playerId) {
    return NextResponse.json({ error: 'session_id and player_id required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('session_signups')
    .delete()
    .eq('session_id', sessionId)
    .eq('player_id', playerId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
