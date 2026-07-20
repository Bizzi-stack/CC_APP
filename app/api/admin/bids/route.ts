import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const isAdmin = request.cookies.has('admin_token')

  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 })
  }

  // Fetch all bids
  const { data: bids, error } = await supabase
    .from('transfer_bids')
    .select('*, player:players(*), bidder:franchises!bidder_franchise_id(*), seller:franchises!seller_franchise_id(*)')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ bids })
}

export async function PATCH(request: NextRequest) {
  const isAdmin = request.cookies.has('admin_token')

  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 })
  }

  try {
    const { bidId, status, counterAmount } = await request.json()

    if (!bidId || !status || !['approved', 'rejected', 'counter_proposed'].includes(status)) {
      return NextResponse.json({ error: 'Bid ID and a valid status are required' }, { status: 400 })
    }

    // Fetch the bid
    const { data: bid, error: bidError } = await supabase
      .from('transfer_bids')
      .select('*')
      .eq('id', bidId)
      .single()

    if (bidError || !bid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
    }

    if (bid.status !== 'pending') {
      return NextResponse.json({ error: 'Can only respond to pending transfer bids' }, { status: 400 })
    }

    if (status === 'rejected') {
      const { error: rejectError } = await supabase
        .from('transfer_bids')
        .update({ status: 'rejected' })
        .eq('id', bidId)

      if (rejectError) {
        return NextResponse.json({ error: rejectError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, status: 'rejected' })
    }

    if (status === 'counter_proposed') {
      if (!counterAmount || isNaN(counterAmount) || Number(counterAmount) <= 0) {
        return NextResponse.json({ error: 'A positive counter proposal amount is required' }, { status: 400 })
      }

      const { error: counterError } = await supabase
        .from('transfer_bids')
        .update({ status: 'counter_proposed', counter_amount: Number(counterAmount) })
        .eq('id', bidId)

      if (counterError) {
        return NextResponse.json({ error: counterError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, status: 'counter_proposed' })
    }

    // status === 'approved'
    const transferCost = bid.bid_amount

    // Fetch bidder details
    const { data: bidder, error: bidderError } = await supabase
      .from('franchises')
      .select('*')
      .eq('id', bid.bidder_franchise_id)
      .single()

    if (bidderError || !bidder) {
      return NextResponse.json({ error: 'Bidder franchise not found' }, { status: 404 })
    }

    if (bidder.budget < transferCost) {
      return NextResponse.json({ error: `Bidder has insufficient credits. Needs ${transferCost.toLocaleString()} CR but only has ${bidder.budget.toLocaleString()} CR.` }, { status: 400 })
    }

    // Fetch seller details (if set)
    let seller = null
    if (bid.seller_franchise_id) {
      const { data: s } = await supabase
        .from('franchises')
        .select('*')
        .eq('id', bid.seller_franchise_id)
        .single()
      seller = s
    }

    // 1. Deduct bid amount from bidder
    const { error: deductError } = await supabase
      .from('franchises')
      .update({ budget: bidder.budget - transferCost })
      .eq('id', bid.bidder_franchise_id)

    if (deductError) {
      return NextResponse.json({ error: 'Failed to update bidder budget' }, { status: 500 })
    }

    // 2. Add bid amount to seller
    if (seller) {
      const { error: creditError } = await supabase
        .from('franchises')
        .update({ budget: seller.budget + transferCost })
        .eq('id', bid.seller_franchise_id)

      if (creditError) {
        // Rollback bidder budget
        await supabase
          .from('franchises')
          .update({ budget: bidder.budget })
          .eq('id', bid.bidder_franchise_id)

        return NextResponse.json({ error: 'Failed to update seller budget' }, { status: 500 })
      }
    }

    // 3. Update player franchise assignment
    const { error: playerUpdateError } = await supabase
      .from('players')
      .update({ franchise_id: bid.bidder_franchise_id, available: false })
      .eq('id', bid.player_id)

    if (playerUpdateError) {
      // Rollback bidder and seller budgets
      await supabase
        .from('franchises')
        .update({ budget: bidder.budget })
        .eq('id', bid.bidder_franchise_id)
      if (seller) {
        await supabase
          .from('franchises')
          .update({ budget: seller.budget })
          .eq('id', bid.seller_franchise_id)
      }

      return NextResponse.json({ error: 'Failed to transfer player assignment' }, { status: 500 })
    }

    // 4. Mark bid as approved
    const { error: approveError } = await supabase
      .from('transfer_bids')
      .update({ status: 'approved' })
      .eq('id', bidId)

    if (approveError) {
      console.error('Failed to update bid status to approved', approveError)
    }

    return NextResponse.json({ success: true, status: 'approved' })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
