import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'

// Fetch incoming contract offers for logged-in player
export async function GET(request: NextRequest) {
  const playerId = request.cookies.get('player_token')?.value

  if (!playerId) {
    return NextResponse.json({ error: 'Not authenticated as a player' }, { status: 401 })
  }

  const { data: offers, error } = await supabase
    .from('free_agent_offers')
    .select('*, franchise:franchises(*), player:players(*)')
    .eq('player_id', playerId)
    .in('status', ['pending', 'countered', 'rejected'])
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ offers })
}

// Player responding to a contract offer (accept, reject, or counter-offer wage)
export async function POST(request: NextRequest) {
  const playerId = request.cookies.get('player_token')?.value

  if (!playerId) {
    return NextResponse.json({ error: 'Not authenticated as a player' }, { status: 401 })
  }

  try {
    const { offerId, action, counterWage } = await request.json()

    if (!offerId || !action || !['accept', 'reject', 'counter', 'dismiss'].includes(action)) {
      return NextResponse.json({ error: 'Offer ID and valid action (accept/reject/counter/dismiss) are required' }, { status: 400 })
    }

    // Fetch offer details
    const { data: offer, error: offerError } = await supabase
      .from('free_agent_offers')
      .select('*, franchise:franchises(*), player:players(*)')
      .eq('id', offerId)
      .eq('player_id', playerId)
      .single()

    if (offerError || !offer) {
      return NextResponse.json({ error: 'Contract offer not found' }, { status: 404 })
    }

    const player = offer.player
    const franchise = offer.franchise

    if (action === 'dismiss') {
      if (offer.status !== 'rejected') {
        return NextResponse.json({ error: 'Only rejected offers can be dismissed' }, { status: 400 })
      }
      
      const { error: deleteError } = await supabase
        .from('free_agent_offers')
        .delete()
        .eq('id', offerId)

      if (deleteError) {
        return NextResponse.json({ error: 'Failed to dismiss offer' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Offer dismissed' })
    }

    if (action === 'accept') {
      const agreedWage = offer.offered_wage
      const playerValue = player.value || 0

      if (franchise.budget < playerValue) {
        return NextResponse.json({ error: `Franchise budget insufficient (${franchise.budget.toLocaleString()} CR available). Cannot complete signing.` }, { status: 400 })
      }

      // Deduct player market value from franchise budget
      const { error: budgetError } = await supabase
        .from('franchises')
        .update({ budget: franchise.budget - playerValue })
        .eq('id', franchise.id)

      if (budgetError) {
        return NextResponse.json({ error: 'Failed to update franchise budget' }, { status: 500 })
      }

      // Sign player to franchise and set agreed daily wage
      const { error: updatePlayerError } = await supabase
        .from('players')
        .update({ available: false, franchise_id: franchise.id, wages: agreedWage })
        .eq('id', playerId)

      if (updatePlayerError) {
        await supabase.from('franchises').update({ budget: franchise.budget }).eq('id', franchise.id)
        return NextResponse.json({ error: 'Failed to sign to franchise' }, { status: 500 })
      }

      // Mark offer as accepted
      await supabase
        .from('free_agent_offers')
        .update({ status: 'accepted' })
        .eq('id', offerId)

      return NextResponse.json({ success: true, message: `Congratulations! You have signed to ${franchise.name} at ${agreedWage.toLocaleString()} CR/day!` })
    }

    if (action === 'reject') {
      await supabase
        .from('free_agent_offers')
        .update({ status: 'rejected' })
        .eq('id', offerId)

      return NextResponse.json({ success: true })
    }

    if (action === 'counter') {
      if (!counterWage || isNaN(counterWage) || Number(counterWage) < 100) {
        return NextResponse.json({ error: 'Please enter a valid counter wage (minimum 100 CR/day)' }, { status: 400 })
      }

      const counterVal = Number(counterWage)

      const { data: updated, error: updateErr } = await supabase
        .from('free_agent_offers')
        .update({
          offered_wage: counterVal,
          proposed_by: 'player',
          status: 'countered',
          updated_at: new Date().toISOString()
        })
        .eq('id', offerId)
        .select()
        .single()

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, offer: updated, message: `Counter-offer of ${counterVal.toLocaleString()} CR/day submitted to ${franchise.name}!` })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 })
  }
}
