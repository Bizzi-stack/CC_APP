import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const playerId = request.cookies.get('player_token')?.value

  if (!playerId) {
    return NextResponse.json({ error: 'Not authenticated as a player' }, { status: 401 })
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

  if (player.wages <= 0) {
    return NextResponse.json({ error: 'You have no wages assigned to collect yet.' }, { status: 400 })
  }

  const now = new Date()
  if (player.last_wage_collection) {
    const lastCollection = new Date(player.last_wage_collection)
    const diffMs = now.getTime() - lastCollection.getTime()
    const hoursPassed = diffMs / (1000 * 60 * 60)

    if (hoursPassed < 24) {
      const hoursRemaining = Math.ceil(24 - hoursPassed)
      return NextResponse.json({
        error: `Wages already collected today. Please wait ${hoursRemaining} hour(s) to collect again.`
      }, { status: 429 })
    }
  }

  // If player is signed to a franchise, deduct wages from the franchise's budget
  if (player.franchise_id) {
    const { data: franchise, error: franchiseError } = await supabase
      .from('franchises')
      .select('budget')
      .eq('id', player.franchise_id)
      .single()

    if (franchiseError || !franchise) {
      return NextResponse.json({ error: 'Franchise details not found' }, { status: 404 })
    }

    const { error: franchiseUpdateError } = await supabase
      .from('franchises')
      .update({ budget: franchise.budget - player.wages })
      .eq('id', player.franchise_id)

    if (franchiseUpdateError) {
      return NextResponse.json({ error: 'Failed to deduct wages from franchise budget' }, { status: 500 })
    }
  }

  const newBalance = player.balance + player.wages

  const { error: updateError } = await supabase
    .from('players')
    .update({
      balance: newBalance,
      last_wage_collection: now.toISOString()
    })
    .eq('id', playerId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    balance: newBalance,
    collected: player.wages
  })
}
