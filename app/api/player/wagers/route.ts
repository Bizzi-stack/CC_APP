import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET all wagers for the logged-in player
export async function GET(request: NextRequest) {
  try {
    const tokenCookie = request.cookies.get('player_token')
    if (!tokenCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: wagers, error } = await supabase
      .from('player_wagers')
      .select(`
        *,
        challenge:franchise_challenges(
          *,
          challenger:franchises!franchise_challenges_challenger_id_fkey(id, name, logo_url),
          challenged:franchises!franchise_challenges_challenged_id_fkey(id, name, logo_url)
        ),
        predicted_winner:franchises!player_wagers_predicted_winner_id_fkey(id, name, logo_url)
      `)
      .eq('player_id', tokenCookie.value)
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      return NextResponse.json({ error: 'Failed to fetch wagers' }, { status: 500 })
    }

    return NextResponse.json({ wagers: wagers || [] })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST create a new wager
export async function POST(request: NextRequest) {
  try {
    const tokenCookie = request.cookies.get('player_token')
    if (!tokenCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const playerId = tokenCookie.value

    const body = await request.json()
    const { challenge_id, predicted_winner_id, wager_amount } = body

    if (!challenge_id || !wager_amount || wager_amount <= 0) {
      return NextResponse.json({ error: 'Invalid wager details' }, { status: 400 })
    }

    // 1. Verify player balance
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('balance, franchise_id, is_franchise_owner')
      .eq('id', playerId)
      .single()

    if (playerError || !player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    if ((player.balance || 0) < wager_amount) {
      return NextResponse.json({ error: 'Insufficient balance to place wager' }, { status: 400 })
    }

    // 2. Verify challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('franchise_challenges')
      .select('*')
      .eq('id', challenge_id)
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    if (challenge.status !== 'accepted') {
      return NextResponse.json({ error: 'Can only bet on active matches' }, { status: 400 })
    }

    if (player.franchise_id && !player.is_franchise_owner && (challenge.challenger_id === player.franchise_id || challenge.challenged_id === player.franchise_id)) {
      return NextResponse.json({ error: 'Cannot bet on matches involving your own franchise' }, { status: 400 })
    }

    // 3. Deduct balance
    const newBalance = (player.balance || 0) - wager_amount
    const { error: updateError } = await supabase
      .from('players')
      .update({ balance: newBalance })
      .eq('id', playerId)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 })
    }

    // 4. Create wager record
    const { data: newWager, error: wagerError } = await supabase
      .from('player_wagers')
      .insert([{
        player_id: playerId,
        challenge_id,
        predicted_winner_id: predicted_winner_id || null, // null means draw
        wager_amount,
        status: 'pending'
      }])
      .select()
      .single()

    if (wagerError) {
      // Rollback balance (best effort)
      await supabase.from('players').update({ balance: player.balance }).eq('id', playerId)
      return NextResponse.json({ error: 'Failed to record wager' }, { status: 500 })
    }

    return NextResponse.json({ success: true, wager: newWager })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
