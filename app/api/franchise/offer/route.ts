import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'

// Fetch contract offers for logged-in franchise owner
export async function GET(request: NextRequest) {
  const franchiseId = request.cookies.get('franchise_token')?.value

  if (!franchiseId) {
    return NextResponse.json({ error: 'Not authenticated as a franchise owner' }, { status: 401 })
  }

  const { data: offers, error } = await supabase
    .from('free_agent_offers')
    .select('*, player:players(*), franchise:franchises(*)')
    .eq('franchise_id', franchiseId)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ offers })
}

// Send or respond to a Free Agent contract offer
export async function POST(request: NextRequest) {
  const franchiseId = request.cookies.get('franchise_token')?.value

  if (!franchiseId) {
    return NextResponse.json({ error: 'Not authenticated as a franchise owner' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { offerId, playerId, offeredWage, action } = body

    // 1. Franchise accepting a player's counter-offer
    if (action === 'accept_counter' && offerId) {
      const { data: offer, error: offerError } = await supabase
        .from('free_agent_offers')
        .select('*, player:players(*), franchise:franchises(*)')
        .eq('id', offerId)
        .eq('franchise_id', franchiseId)
        .single()

      if (offerError || !offer) {
        return NextResponse.json({ error: 'Offer not found' }, { status: 404 })
      }

      if (offer.status !== 'countered' || offer.proposed_by !== 'player') {
        return NextResponse.json({ error: 'No active player counter-offer to accept' }, { status: 400 })
      }

      const player = offer.player
      const franchise = offer.franchise
      const agreedWage = offer.offered_wage
      const playerValue = player.value || 0

      if (franchise.budget < playerValue) {
        return NextResponse.json({ error: `Insufficient budget to sign ${player.name}. Requires ${playerValue.toLocaleString()} CR.` }, { status: 400 })
      }

      // Deduct budget
      const { error: budgetError } = await supabase
        .from('franchises')
        .update({ budget: franchise.budget - playerValue })
        .eq('id', franchiseId)

      if (budgetError) {
        return NextResponse.json({ error: 'Failed to update franchise budget' }, { status: 500 })
      }

      // Sign player
      const { error: playerUpdateError } = await supabase
        .from('players')
        .update({ available: false, franchise_id: franchiseId, wages: agreedWage })
        .eq('id', player.id)

      if (playerUpdateError) {
        await supabase.from('franchises').update({ budget: franchise.budget }).eq('id', franchiseId)
        return NextResponse.json({ error: 'Failed to sign player' }, { status: 500 })
      }

      // Mark offer as accepted
      await supabase
        .from('free_agent_offers')
        .update({ status: 'accepted' })
        .eq('id', offerId)

      return NextResponse.json({ success: true, message: `Successfully signed ${player.name} at ${agreedWage.toLocaleString()} CR/day!` })
    }

    // 2. Reject offer
    if (action === 'reject' && offerId) {
      await supabase
        .from('free_agent_offers')
        .update({ status: 'rejected' })
        .eq('id', offerId)

      return NextResponse.json({ success: true })
    }

    // 3. Propose new contract offer to a Free Agent
    if (!playerId || !offeredWage || isNaN(offeredWage) || Number(offeredWage) < 100) {
      return NextResponse.json({ error: 'Player ID and a valid daily wage (minimum 100 CR) are required' }, { status: 400 })
    }

    const wageVal = Number(offeredWage)

    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single()

    if (playerError || !player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    if (!player.available || player.status !== 'active') {
      return NextResponse.json({ error: 'Player is not available for signing' }, { status: 400 })
    }

    // Check if there is already a pending offer for this player from this franchise
    const { data: existingOffer } = await supabase
      .from('free_agent_offers')
      .select('*')
      .eq('player_id', playerId)
      .eq('franchise_id', franchiseId)
      .in('status', ['pending', 'countered'])
      .single()

    if (existingOffer) {
      const { data: updated, error: updateErr } = await supabase
        .from('free_agent_offers')
        .update({
          offered_wage: wageVal,
          proposed_by: 'franchise',
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingOffer.id)
        .select()
        .single()

      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })
      return NextResponse.json({ success: true, offer: updated })
    }

    const { data: newOffer, error: insertErr } = await supabase
      .from('free_agent_offers')
      .insert([{
        player_id: playerId,
        franchise_id: franchiseId,
        offered_wage: wageVal,
        proposed_by: 'franchise',
        status: 'pending'
      }])
      .select()
      .single()

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, offer: newOffer })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 })
  }
}
