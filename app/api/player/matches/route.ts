import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // 1. Get logged-in player
    const tokenCookie = request.cookies.get('player_token')
    if (!tokenCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('franchise_id, is_franchise_owner')
      .eq('id', tokenCookie.value)
      .single()

    if (playerError || !player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    // 2. Fetch all accepted matches
    let query = supabase
      .from('franchise_challenges')
      .select(`
        *,
        challenger:franchises!franchise_challenges_challenger_id_fkey(id, name, logo_url),
        challenged:franchises!franchise_challenges_challenged_id_fkey(id, name, logo_url)
      `)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })

    // 3. Exclude matches involving the player's franchise (unless they are the owner)
    if (player.franchise_id && !player.is_franchise_owner) {
      query = query.neq('challenger_id', player.franchise_id).neq('challenged_id', player.franchise_id)
    }

    const { data: matches, error: matchesError } = await query

    if (matchesError) {
      console.error(matchesError)
      return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 })
    }

    // Since Supabase doesn't perfectly support an OR query with multiple NEQ conditions easily in one builder chain 
    // without advanced filters, let's filter in memory just to be absolutely safe
    let finalMatches = matches || []
    if (player.franchise_id && !player.is_franchise_owner) {
      finalMatches = finalMatches.filter(m => m.challenger_id !== player.franchise_id && m.challenged_id !== player.franchise_id)
    }

    return NextResponse.json({ matches: finalMatches })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
