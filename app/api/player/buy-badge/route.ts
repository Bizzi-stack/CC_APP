import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const playerId = request.cookies.get('player_token')?.value

  if (!playerId) {
    return NextResponse.json({ error: 'Not authenticated as a player' }, { status: 401 })
  }

  try {
    const { badgeId } = await request.json()

    if (!badgeId) {
      return NextResponse.json({ error: 'Badge ID is required' }, { status: 400 })
    }

    // Verify badge exists and is listed for sale
    const { data: badge, error: badgeError } = await supabase
      .from('canvas_badges')
      .select('*')
      .eq('id', badgeId)
      .single()

    if (badgeError || !badge) {
      return NextResponse.json({ error: 'Badge not found' }, { status: 404 })
    }

    if (!badge.is_listed) {
      return NextResponse.json({ error: 'This badge is not listed for sale' }, { status: 400 })
    }

    if (badge.owner_id === playerId) {
      return NextResponse.json({ error: 'You already own this badge' }, { status: 400 })
    }

    // Fetch buyer profile
    const { data: buyer, error: buyerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single()

    if (buyerError || !buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 })
    }

    const price = badge.price

    if (buyer.balance < price) {
      return NextResponse.json({ error: `Insufficient credits. Needs ${price.toLocaleString()} CR but you only have ${buyer.balance.toLocaleString()} CR.` }, { status: 400 })
    }

    const isResale = badge.owner_id !== null

    if (isResale) {
      const sellerId = badge.owner_id

      // Fetch seller profile
      const { data: seller, error: sellerError } = await supabase
        .from('players')
        .select('*')
        .eq('id', sellerId)
        .single()

      if (sellerError || !seller) {
        return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
      }

      // Deduct from buyer
      const buyerOwned = buyer.owned_badge_ids || []
      const newBuyerOwned = [...buyerOwned.filter((id: string) => id !== badgeId), badgeId]
      const { error: buyerUpdateError } = await supabase
        .from('players')
        .update({
          balance: buyer.balance - price,
          owned_badge_ids: newBuyerOwned
        })
        .eq('id', playerId)

      if (buyerUpdateError) {
        return NextResponse.json({ error: 'Failed to update buyer balance' }, { status: 500 })
      }

      // Add to seller
      const sellerOwned = seller.owned_badge_ids || []
      const newSellerOwned = sellerOwned.filter((id: string) => id !== badgeId)
      
      // Also remove from seller's canvas layout if they placed it there
      const sellerCanvas = seller.canvas_badges_data || []
      const newSellerCanvas = sellerCanvas.filter((c: any) => c.id !== badgeId)
      
      const { error: sellerUpdateError } = await supabase
        .from('players')
        .update({
          balance: seller.balance + price,
          owned_badge_ids: newSellerOwned,
          canvas_badges_data: newSellerCanvas
        })
        .eq('id', sellerId)

      if (sellerUpdateError) {
        // Rollback buyer
        await supabase
          .from('players')
          .update({
            balance: buyer.balance,
            owned_badge_ids: buyerOwned
          })
          .eq('id', playerId)

        return NextResponse.json({ error: 'Failed to update seller balance' }, { status: 500 })
      }
    } else {
      // Initial sale from general library (no current owner)
      const buyerOwned = buyer.owned_badge_ids || []
      const newBuyerOwned = [...buyerOwned.filter((id: string) => id !== badgeId), badgeId]
      const { error: buyerUpdateError } = await supabase
        .from('players')
        .update({
          balance: buyer.balance - price,
          owned_badge_ids: newBuyerOwned
        })
        .eq('id', playerId)

      if (buyerUpdateError) {
        return NextResponse.json({ error: 'Failed to update buyer balance' }, { status: 500 })
      }
    }

    // Update badge ownership and listing status
    const { error: badgeUpdateError } = await supabase
      .from('canvas_badges')
      .update({
        owner_id: playerId,
        is_listed: false
      })
      .eq('id', badgeId)

    if (badgeUpdateError) {
      return NextResponse.json({ error: 'Failed to update badge ownership status' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      balance: buyer.balance - price
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 })
  }
}
