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

  // Enrich with owned_franchise data if player is a franchise owner
  let enrichedPlayer = { ...player, owned_franchise: null as any, is_top_scorer: false, is_top_assister: false }
  if (player.owned_franchise_id) {
    const { data: ownedFranchise } = await supabase
      .from('franchises')
      .select('id, name, logo_url')
      .eq('id', player.owned_franchise_id)
      .single()
    enrichedPlayer.owned_franchise = ownedFranchise || null
  }

  // Determine if player is a top scorer/assister
  const { data: topScorer } = await supabase.from('players').select('goals').order('goals', { ascending: false }).limit(1).single()
  const { data: topAssister } = await supabase.from('players').select('assists').order('assists', { ascending: false }).limit(1).single()

  if (topScorer && topScorer.goals > 0 && enrichedPlayer.goals === topScorer.goals) {
    enrichedPlayer.is_top_scorer = true
  }
  if (topAssister && topAssister.assists > 0 && enrichedPlayer.assists === topAssister.assists) {
    enrichedPlayer.is_top_assister = true
  }

  return NextResponse.json({ player: enrichedPlayer })
}
