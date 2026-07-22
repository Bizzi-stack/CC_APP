import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const playerId = request.cookies.get('player_token')?.value

  if (!playerId) {
    return NextResponse.json({ error: 'Not authenticated as a player' }, { status: 401 })
  }

  let { data: player, error } = await supabase
    .from('players')
    .select('*, franchises:franchises!franchise_id(*), owned_franchise:franchises!players_owned_franchise_id_fkey(id, name, logo_url)')
    .eq('id', playerId)
    .single()

  if (error || !player) {
    const fallback = await supabase
      .from('players')
      .select('*, franchises(*)')
      .eq('id', playerId)
      .single()

    player = fallback.data
    error = fallback.error
  }

  if (error || !player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  }

  return NextResponse.json({ player })
}
