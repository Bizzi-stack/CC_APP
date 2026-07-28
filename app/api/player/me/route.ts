import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const playerId = request.cookies.get('player_token')?.value

  if (!playerId) {
    return NextResponse.json({ error: 'Not authenticated as a player' }, { status: 401 })
  }

  const { data: player, error } = await supabase
    .from('players')
    .select('*, franchises:franchises!players_franchise_id_fkey(*)')
    .eq('id', playerId)
    .single()

  if (error || !player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  }

  // Enrich with owned_franchise data & determine top badges in parallel
  const [ofRes, tsRes, taRes] = await Promise.all([
    player.owned_franchise_id ? supabase.from('franchises').select('id, name, logo_url').eq('id', player.owned_franchise_id).single() : Promise.resolve({ data: null }),
    supabase.from('players').select('goals').order('goals', { ascending: false }).limit(1).single(),
    supabase.from('players').select('assists').order('assists', { ascending: false }).limit(1).single()
  ])

  const enrichedPlayer = {
    ...player,
    owned_franchise: ofRes.data || null,
    is_top_scorer: Boolean(tsRes.data && tsRes.data.goals > 0 && player.goals === tsRes.data.goals),
    is_top_assister: Boolean(taRes.data && taRes.data.assists > 0 && player.assists === taRes.data.assists)
  }

  return NextResponse.json({ player: enrichedPlayer })
}
