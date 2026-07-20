import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const playerId = request.cookies.get('player_token')?.value

  if (!playerId) {
    return NextResponse.json({ error: 'Not authenticated as a player' }, { status: 401 })
  }

  try {
    const { canvasBadgesData } = await request.json()

    if (!Array.isArray(canvasBadgesData)) {
      return NextResponse.json({ error: 'Invalid canvas badges layout format' }, { status: 400 })
    }

    // Fetch player profile
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single()

    if (playerError || !player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    const ownedBadges = player.owned_badge_ids || []
    
    // Security check: ensure player owns all badges they are placing
    for (const item of canvasBadgesData) {
      if (!item.id || !ownedBadges.includes(item.id)) {
        return NextResponse.json({ error: 'Cannot place un-owned badges on your canvas.' }, { status: 403 })
      }
    }

    const badgeIds = canvasBadgesData.map((b: any) => b.id)

    const { error: updateError } = await supabase
      .from('players')
      .update({
        canvas_badges_data: canvasBadgesData,
        canvas_badge_ids: badgeIds
      })
      .eq('id', playerId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
