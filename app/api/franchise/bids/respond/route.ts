import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const franchiseId = request.cookies.get('franchise_token')?.value

  if (!franchiseId) {
    return NextResponse.json({ error: 'Not authenticated as a franchise owner' }, { status: 401 })
  }

  try {
    const { bidId, action, counterAmount } = await request.json()

    if (!bidId || !action || !['accept', 'decline', 'reject', 'counter'].includes(action)) {
      return NextResponse.json({ error: 'Bid ID and a valid action are required' }, { status: 400 })
    }

    // Fetch the bid
    const { data: bid, error: bidError } = await supabase
      .from('transfer_bids')
      .select('*, player:players(*)')
      .eq('id', bidId)
      .single()

    if (bidError || !bid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
    }

    const isBidder = bid.bidder_franchise_id === franchiseId
    const isSeller = bid.seller_franchise_id === franchiseId

    if (!isBidder && !isSeller) {
      return NextResponse.json({ error: 'Unauthorized response to this bid' }, { status: 403 })
    }

    // --- Scenario 1: Seller responding to PENDING bid ---
    if (isSeller) {
      if (bid.status !== 'pending') {
        return NextResponse.json({ error: 'Seller can only respond to pending bids' }, { status: 400 })
      }

      if (action === 'reject' || action === 'decline') {
        const { error: updateError } = await supabase
          .from('transfer_bids')
          .update({ status: 'rejected' })
          .eq('id', bidId)

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 })
        }
        return NextResponse.json({ success: true, status: 'rejected' })
      }

      if (action === 'counter') {
        if (!counterAmount || isNaN(counterAmount) || Number(counterAmount) <= 0) {
          return NextResponse.json({ error: 'A positive counter offer amount is required' }, { status: 400 })
        }

        const { error: counterError } = await supabase
          .from('transfer_bids')
          .update({ status: 'counter_proposed', counter_amount: Number(counterAmount) })
          .eq('id', bidId)

        if (counterError) {
          return NextResponse.json({ error: counterError.message }, { status: 500 })
        }
        return NextResponse.json({ success: true, status: 'counter_proposed', counterAmount: Number(counterAmount) })
      }

      if (action === 'accept') {
        const transferCost = bid.bid_amount

        // Fetch bidder (buyer) details
        const { data: bidder, error: bidderError } = await supabase
          .from('franchises')
          .select('*')
          .eq('id', bid.bidder_franchise_id)
          .single()

        if (bidderError || !bidder) {
          return NextResponse.json({ error: 'Bidder franchise not found' }, { status: 404 })
        }

        if (bidder.budget < transferCost) {
          return NextResponse.json({ error: `Bidder has insufficient credits. Needs ${transferCost.toLocaleString()} CR but you only have ${bidder.budget.toLocaleString()} CR.` }, { status: 400 })
        }

        // Fetch seller details
        const { data: seller, error: sellerError } = await supabase
          .from('franchises')
          .select('*')
          .eq('id', franchiseId)
          .single()

        if (sellerError || !seller) {
          return NextResponse.json({ error: 'Seller franchise not found' }, { status: 404 })
        }

        // 1. Deduct counter amount from bidder (buyer)
        const { error: deductError } = await supabase
          .from('franchises')
          .update({ budget: bidder.budget - transferCost })
          .eq('id', bid.bidder_franchise_id)

        if (deductError) {
          return NextResponse.json({ error: 'Failed to update bidder budget' }, { status: 500 })
        }

        // 2. Add counter amount to seller
        const { error: creditError } = await supabase
          .from('franchises')
          .update({ budget: seller.budget + transferCost })
          .eq('id', franchiseId)

        if (creditError) {
          // Rollback bidder budget
          await supabase
            .from('franchises')
            .update({ budget: bidder.budget })
            .eq('id', bid.bidder_franchise_id)

          return NextResponse.json({ error: 'Failed to update seller budget' }, { status: 500 })
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
          await supabase
            .from('franchises')
            .update({ budget: seller.budget })
            .eq('id', franchiseId)

          return NextResponse.json({ error: 'Failed to transfer player assignment' }, { status: 500 })
        }

        // 4. Mark bid as approved
        await supabase
          .from('transfer_bids')
          .update({ status: 'approved' })
          .eq('id', bidId)

        return NextResponse.json({ success: true, status: 'approved' })
      }
    }

    // --- Scenario 2: Bidder (buyer) responding to COUNTER_PROPOSED bid ---
    if (isBidder) {
      if (bid.status !== 'counter_proposed') {
        return NextResponse.json({ error: 'Bidder can only respond to counter-proposed bids' }, { status: 400 })
      }

      if (action === 'decline' || action === 'reject') {
        const { error: updateError } = await supabase
          .from('transfer_bids')
          .update({ status: 'rejected' })
          .eq('id', bidId)

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 })
        }
        return NextResponse.json({ success: true, status: 'rejected' })
      }

      if (action === 'accept') {
        const transferCost = bid.counter_amount
        if (!transferCost || isNaN(transferCost) || transferCost <= 0) {
          return NextResponse.json({ error: 'Invalid counter proposal amount' }, { status: 400 })
        }

        // Fetch bidder (buyer) details
        const { data: bidder, error: bidderError } = await supabase
          .from('franchises')
          .select('*')
          .eq('id', franchiseId)
          .single()

        if (bidderError || !bidder) {
          return NextResponse.json({ error: 'Bidder franchise not found' }, { status: 404 })
        }

        if (bidder.budget < transferCost) {
          return NextResponse.json({ error: `Insufficient credits to accept counter proposal. Needs ${transferCost.toLocaleString()} CR but you only have ${bidder.budget.toLocaleString()} CR.` }, { status: 400 })
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

        if (!seller) {
          return NextResponse.json({ error: 'Seller franchise not found' }, { status: 404 })
        }

        // 1. Deduct counter amount from bidder
        const { error: deductError } = await supabase
          .from('franchises')
          .update({ budget: bidder.budget - transferCost })
          .eq('id', franchiseId)

        if (deductError) {
          return NextResponse.json({ error: 'Failed to update bidder budget' }, { status: 500 })
        }

        // 2. Add counter amount to seller
        const { error: creditError } = await supabase
          .from('franchises')
          .update({ budget: seller.budget + transferCost })
          .eq('id', bid.seller_franchise_id)

        if (creditError) {
          // Rollback bidder budget
          await supabase
            .from('franchises')
            .update({ budget: bidder.budget })
            .eq('id', franchiseId)

          return NextResponse.json({ error: 'Failed to update seller budget' }, { status: 500 })
        }

        // 3. Update player franchise assignment
        const { error: playerUpdateError } = await supabase
          .from('players')
          .update({ franchise_id: franchiseId, available: false })
          .eq('id', bid.player_id)

        if (playerUpdateError) {
          // Rollback bidder and seller budgets
          await supabase
            .from('franchises')
            .update({ budget: bidder.budget })
            .eq('id', franchiseId)
          await supabase
            .from('franchises')
            .update({ budget: seller.budget })
            .eq('id', bid.seller_franchise_id)

          return NextResponse.json({ error: 'Failed to transfer player assignment' }, { status: 500 })
        }

        // 4. Mark bid as approved
        await supabase
          .from('transfer_bids')
          .update({ status: 'approved' })
          .eq('id', bidId)

        return NextResponse.json({ success: true, status: 'approved' })
      }
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
