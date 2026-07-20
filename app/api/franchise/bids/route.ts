import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const franchiseId = request.cookies.get('franchise_token')?.value

  if (!franchiseId) {
    return NextResponse.json({ error: 'Not authenticated as a franchise owner' }, { status: 401 })
  }

  // Fetch outgoing bids (placed by this franchise)
  const { data: outgoingBids, error: outgoingError } = await supabase
    .from('transfer_bids')
    .select('*, player:players(*), bidder:franchises!bidder_franchise_id(*), seller:franchises!seller_franchise_id(*)')
    .eq('bidder_franchise_id', franchiseId)
    .order('created_at', { ascending: false })

  if (outgoingError) {
    return NextResponse.json({ error: outgoingError.message }, { status: 500 })
  }

  // Fetch incoming bids (placed on players belonging to this franchise)
  const { data: incomingBids, error: incomingError } = await supabase
    .from('transfer_bids')
    .select('*, player:players(*), bidder:franchises!bidder_franchise_id(*), seller:franchises!seller_franchise_id(*)')
    .eq('seller_franchise_id', franchiseId)
    .order('created_at', { ascending: false })

  if (incomingError) {
    return NextResponse.json({ error: incomingError.message }, { status: 500 })
  }

  return NextResponse.json({ outgoingBids, incomingBids })
}

export async function POST(request: NextRequest) {
  const franchiseId = request.cookies.get('franchise_token')?.value

  if (!franchiseId) {
    return NextResponse.json({ error: 'Not authenticated as a franchise owner' }, { status: 401 })
  }

  try {
    const { playerId, bidAmount } = await request.json()

    if (!playerId || !bidAmount || isNaN(bidAmount) || Number(bidAmount) <= 0) {
      return NextResponse.json({ error: 'Player ID and a positive bid amount are required' }, { status: 400 })
    }

    const bidVal = Number(bidAmount)

    // Fetch player details
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single()

    if (playerError || !player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    if (player.status !== 'active') {
      return NextResponse.json({ error: 'Player is not active on transfer list' }, { status: 400 })
    }

    if (!player.franchise_id) {
      return NextResponse.json({ error: 'Cannot place a transfer bid on a Free Agent. Sign them directly!' }, { status: 400 })
    }

    if (player.franchise_id === franchiseId) {
      return NextResponse.json({ error: 'Cannot bid on your own player' }, { status: 400 })
    }

    // Fetch bidder franchise details
    const { data: franchise, error: franchiseError } = await supabase
      .from('franchises')
      .select('*')
      .eq('id', franchiseId)
      .single()

    if (franchiseError || !franchise) {
      return NextResponse.json({ error: 'Franchise not found' }, { status: 404 })
    }

    if (franchise.budget < bidVal) {
      return NextResponse.json({ error: `Insufficient budget to place this bid. You have ${franchise.budget.toLocaleString()} CR.` }, { status: 400 })
    }

    // Check if there is an existing pending bid by this franchise on this player
    const { data: existingBid } = await supabase
      .from('transfer_bids')
      .select('*')
      .eq('player_id', playerId)
      .eq('bidder_franchise_id', franchiseId)
      .eq('status', 'pending')
      .single()

    if (existingBid) {
      // Update the existing pending bid amount
      const { data: updatedBid, error: updateError } = await supabase
        .from('transfer_bids')
        .update({ bid_amount: bidVal })
        .eq('id', existingBid.id)
        .select()
        .single()

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, bid: updatedBid, updated: true })
    }

    // Create a new bid
    const { data: newBid, error: insertError } = await supabase
      .from('transfer_bids')
      .insert([{
        player_id: playerId,
        bidder_franchise_id: franchiseId,
        seller_franchise_id: player.franchise_id,
        bid_amount: bidVal,
        status: 'pending'
      }])
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, bid: newBid })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
