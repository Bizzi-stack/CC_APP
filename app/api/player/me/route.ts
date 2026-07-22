import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const playerId = request.cookies.get('player_token')?.value

  if (!playerId) {
    return NextResponse.json({ error: 'Not authenticated as a player' }, { status: 401 })
  }

  const { data: player, error } = await supabase
    .from('players')
    .select('*, franchises:franchises!franchise_id(*), owned_franchise:franchises!owned_franchise_id(id, name, logo_url)')
    .eq('id', playerId)
    .single()

  if (error || !player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  }

  return NextResponse.json({ player })
}
