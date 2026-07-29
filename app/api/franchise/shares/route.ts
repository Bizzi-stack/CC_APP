import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'

// Helper: check if buyer now owns majority and transfer ownership if so
async function checkMajorityTakeover(buyerId: string, franchiseId: string): Promise<string | null> {
  // Sum all shares in circulation for this franchise
  const { data: allShares } = await supabase
    .from('franchise_shares')
    .select('owner_id, shares_count')
    .eq('franchise_id', franchiseId)

  if (!allShares || allShares.length === 0) return null

  const totalShares = allShares.reduce((s, r) => s + (r.shares_count || 0), 0)
  const buyerRow = allShares.find(r => r.owner_id === buyerId)
  const buyerShares = buyerRow?.shares_count || 0

  if (totalShares === 0 || buyerShares <= totalShares / 2) return null

  // Buyer has majority — check who the current owner is
  const { data: currentOwner } = await supabase
    .from('players')
    .select('id, name, is_franchise_owner, owned_franchise_id')
    .eq('owned_franchise_id', franchiseId)
    .eq('is_franchise_owner', true)
    .single()

  // Don't transfer if already the owner
  if (currentOwner?.id === buyerId) return null

  // Demote old owner
  if (currentOwner) {
    await supabase
      .from('players')
      .update({ is_franchise_owner: false, owned_franchise_id: null })
      .eq('id', currentOwner.id)
  }

  // Promote buyer
  await supabase
    .from('players')
    .update({ is_franchise_owner: true, owned_franchise_id: franchiseId })
    .eq('id', buyerId)

  // Fetch franchise name for the message
  const { data: franchise } = await supabase
    .from('franchises')
    .select('name')
    .eq('id', franchiseId)
    .single()

  return franchise?.name || 'the franchise'
}

// GET /api/franchise/shares - Fetch all franchise share valuations, listings, and user holdings
export async function GET(request: NextRequest) {
  try {
    const playerToken = request.cookies.get('player_token')?.value
    const franchiseToken = request.cookies.get('franchise_token')?.value

    let playerId = playerToken

    if (!playerId && franchiseToken) {
      const { data: ownerPlayer } = await supabase
        .from('players')
        .select('id')
        .eq('owned_franchise_id', franchiseToken)
        .eq('is_franchise_owner', true)
        .single()

      if (ownerPlayer) {
        playerId = ownerPlayer.id
      }
    }

    // 1. Fetch franchises, players, and active listings
    const [fRes, pRes, lRes, sRes] = await Promise.all([
      supabase.from('franchises').select('*'),
      supabase.from('players').select('id, name, value, franchise_id, is_franchise_owner, owned_franchise_id'),
      supabase.from('franchise_share_listings').select('*, seller:players!seller_id(id, name), franchise:franchises!franchise_id(id, name, logo_url)').eq('status', 'active'),
      supabase.from('franchise_shares').select('*, owner:players!owner_id(id, name), franchise:franchises!franchise_id(id, name, logo_url)')
    ])

    if (fRes.error) throw fRes.error

    const franchises = fRes.data || []
    const players = pRes.data || []
    const listings = lRes.data || []
    const allShares = sRes.data || []

    // Calculate share price for each franchise
    const formattedFranchises = franchises.map(f => {
      // Sum player values for this franchise
      const roster = players.filter(p => p.franchise_id === f.id)
      const totalRosterValue = roster.reduce((sum, p) => sum + (p.value || 0), 0)
      const budget = f.budget || 0
      const wins = f.wins || 0

      // Share Price Formula
      const valuation = budget + totalRosterValue + (wins * 2500)
      const sharePrice = Math.max(100, Math.floor(valuation / 100))

      // User's owned shares in this franchise
      const userShareObj = playerId ? allShares.find(s => s.franchise_id === f.id && s.owner_id === playerId) : null
      const userSharesCount = userShareObj ? userShareObj.shares_count : 0

      // Active listings for this franchise
      const franchiseListings = listings.filter(l => l.franchise_id === f.id)

      return {
        ...f,
        roster_count: roster.length,
        total_roster_value: totalRosterValue,
        total_valuation: valuation,
        share_price: sharePrice,
        user_shares_count: userSharesCount,
        listings: franchiseListings
      }
    })

    // User's portfolio
    const userPortfolio = playerId ? allShares.filter(s => s.owner_id === playerId && s.shares_count > 0).map(s => {
      const f = formattedFranchises.find(item => item.id === s.franchise_id)
      return {
        ...s,
        franchise_name: f?.name || 'Unknown',
        franchise_logo: f?.logo_url || null,
        share_price: f?.share_price || 100,
        total_value: (s.shares_count) * (f?.share_price || 100)
      }
    }) : []

    return NextResponse.json({
      franchises: formattedFranchises,
      listings,
      userPortfolio
    })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/franchise/shares - List shares for sale or Buy shares
export async function POST(request: NextRequest) {
  try {
    const playerToken = request.cookies.get('player_token')?.value
    const franchiseToken = request.cookies.get('franchise_token')?.value

    let playerId = playerToken

    if (!playerId && franchiseToken) {
      const { data: ownerPlayer } = await supabase
        .from('players')
        .select('id')
        .eq('owned_franchise_id', franchiseToken)
        .eq('is_franchise_owner', true)
        .single()

      if (ownerPlayer) {
        playerId = ownerPlayer.id
      }
    }

    if (!playerId) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'list') {
      const { franchise_id, shares_count, price_per_share } = body

      if (!franchise_id || !shares_count || shares_count <= 0 || !price_per_share || price_per_share <= 0) {
        return NextResponse.json({ error: 'Invalid share listing parameters' }, { status: 400 })
      }

      // 1. Verify user owns enough shares in franchise (Auto-seed 100 shares if owner hasn't been seeded yet)
      let { data: userShare } = await supabase
        .from('franchise_shares')
        .select('*')
        .eq('franchise_id', franchise_id)
        .eq('owner_id', playerId)
        .single()

      if (!userShare) {
        const { data: ownerCheck } = await supabase
          .from('players')
          .select('is_franchise_owner, owned_franchise_id')
          .eq('id', playerId)
          .single()

        if (ownerCheck?.is_franchise_owner && ownerCheck.owned_franchise_id === franchise_id) {
          const { data: newShare } = await supabase
            .from('franchise_shares')
            .insert([{ franchise_id, owner_id: playerId, shares_count: 100 }])
            .select()
            .single()

          userShare = newShare
        }
      }

      if (!userShare || userShare.shares_count < shares_count) {
        return NextResponse.json({ error: `Insufficient shares owned. You currently have ${userShare?.shares_count || 0} shares.` }, { status: 400 })
      }

      // 2. Create listing
      const { data: listing, error: listErr } = await supabase
        .from('franchise_share_listings')
        .insert([{
          franchise_id,
          seller_id: playerId,
          shares_count,
          price_per_share,
          status: 'active'
        }])
        .select()
        .single()

      if (listErr) throw listErr

      // 3. Deduct shares from seller's available share balance
      await supabase
        .from('franchise_shares')
        .update({ shares_count: userShare.shares_count - shares_count })
        .eq('id', userShare.id)

      return NextResponse.json({ success: true, listing })
    } else if (action === 'buy') {
      const { listing_id } = body

      if (!listing_id) {
        return NextResponse.json({ error: 'Missing listing_id' }, { status: 400 })
      }

      // 1. Fetch listing details
      const { data: listing, error: listErr } = await supabase
        .from('franchise_share_listings')
        .select('*')
        .eq('id', listing_id)
        .single()

      if (listErr || !listing || listing.status !== 'active') {
        return NextResponse.json({ error: 'Share listing is no longer available.' }, { status: 404 })
      }

      if (listing.seller_id === playerId) {
        return NextResponse.json({ error: 'You cannot buy your own share listing.' }, { status: 400 })
      }

      const totalCost = listing.shares_count * listing.price_per_share

      // 2. Verify buyer balance
      const { data: buyer, error: buyerErr } = await supabase
        .from('players')
        .select('balance')
        .eq('id', playerId)
        .single()

      if (buyerErr || !buyer || (buyer.balance || 0) < totalCost) {
        return NextResponse.json({ error: `Insufficient balance. You need ${totalCost.toLocaleString()} CR to purchase these shares.` }, { status: 400 })
      }

      // 3. Deduct buyer balance
      await supabase
        .from('players')
        .update({ balance: (buyer.balance || 0) - totalCost })
        .eq('id', playerId)

      // 4. Pay seller (If seller is the Franchise Owner listing company shares, money goes to Franchise Budget!)
      const { data: sellerPlayer } = await supabase
        .from('players')
        .select('balance, is_franchise_owner, owned_franchise_id')
        .eq('id', listing.seller_id)
        .single()

      if (sellerPlayer) {
        if (sellerPlayer.is_franchise_owner && sellerPlayer.owned_franchise_id === listing.franchise_id) {
          // Add funds to Franchise Budget
          const { data: f } = await supabase.from('franchises').select('budget').eq('id', listing.franchise_id).single()
          if (f) {
            await supabase.from('franchises').update({ budget: (f.budget || 0) + totalCost }).eq('id', listing.franchise_id)
          }
        } else {
          // Add funds to individual seller balance
          await supabase.from('players').update({ balance: (sellerPlayer.balance || 0) + totalCost }).eq('id', listing.seller_id)
        }
      }

      // 5. Transfer shares to buyer
      const { data: buyerShares } = await supabase
        .from('franchise_shares')
        .select('*')
        .eq('franchise_id', listing.franchise_id)
        .eq('owner_id', playerId)
        .single()

      if (buyerShares) {
        await supabase
          .from('franchise_shares')
          .update({ shares_count: buyerShares.shares_count + listing.shares_count })
          .eq('id', buyerShares.id)
      } else {
        await supabase
          .from('franchise_shares')
          .insert([{
            franchise_id: listing.franchise_id,
            owner_id: playerId,
            shares_count: listing.shares_count
          }])
      }

      // 6. Mark listing as sold
      await supabase
        .from('franchise_share_listings')
        .update({ status: 'sold' })
        .eq('id', listing_id)

      // 7. Record buy transaction for P&L tracking
      await supabase.from('franchise_share_transactions').insert([{
        player_id: playerId,
        franchise_id: listing.franchise_id,
        type: 'buy',
        shares_count: listing.shares_count,
        price_per_share: listing.price_per_share,
        total_amount: totalCost
      }])

      // 8. Check for majority takeover
      const takenOver = await checkMajorityTakeover(playerId, listing.franchise_id)
      const takeoverMsg = takenOver
        ? ` 🏆 You now own the majority of ${takenOver} — you are the new franchise owner!`
        : ''

      return NextResponse.json({ success: true, takeover: !!takenOver, message: `Successfully purchased ${listing.shares_count} shares for ${totalCost.toLocaleString()} CR!${takeoverMsg}` })
    } else if (action === 'cancel') {
      const { listing_id } = body

      if (!listing_id) {
        return NextResponse.json({ error: 'Missing listing_id' }, { status: 400 })
      }

      const { data: listing, error: listErr } = await supabase
        .from('franchise_share_listings')
        .select('*')
        .eq('id', listing_id)
        .eq('seller_id', playerId)
        .single()

      if (listErr || !listing || listing.status !== 'active') {
        return NextResponse.json({ error: 'Listing not found or already inactive.' }, { status: 404 })
      }

      // Mark listing as cancelled
      await supabase
        .from('franchise_share_listings')
        .update({ status: 'cancelled' })
        .eq('id', listing_id)

      // Return shares to seller's balance
      const { data: userShare } = await supabase
        .from('franchise_shares')
        .select('*')
        .eq('franchise_id', listing.franchise_id)
        .eq('owner_id', playerId)
        .single()

      if (userShare) {
        await supabase
          .from('franchise_shares')
          .update({ shares_count: userShare.shares_count + listing.shares_count })
          .eq('id', userShare.id)
      } else {
        await supabase
          .from('franchise_shares')
          .insert([{ franchise_id: listing.franchise_id, owner_id: playerId, shares_count: listing.shares_count }])
      }

      return NextResponse.json({ success: true, message: 'Share listing cancelled and shares returned to your portfolio!' })
    } else if (action === 'buy_primary') {
      const { franchise_id, shares_count } = body

      if (!franchise_id || !shares_count || shares_count <= 0) {
        return NextResponse.json({ error: 'Invalid franchise_id or shares_count' }, { status: 400 })
      }

      // Fetch franchise
      const { data: franchise, error: fErr } = await supabase
        .from('franchises')
        .select('*')
        .eq('id', franchise_id)
        .single()

      if (fErr || !franchise) {
        return NextResponse.json({ error: 'Franchise not found' }, { status: 404 })
      }

      // Calculate share price
      const { data: roster } = await supabase.from('players').select('value').eq('franchise_id', franchise_id)
      const totalRosterValue = (roster || []).reduce((sum, p) => sum + (p.value || 0), 0)
      const valuation = (franchise.budget || 0) + totalRosterValue + ((franchise.wins || 0) * 2500)
      const sharePrice = Math.max(100, Math.floor(valuation / 100))
      const totalCost = shares_count * sharePrice

      // Check buyer balance
      const { data: buyer, error: buyerErr } = await supabase
        .from('players')
        .select('balance')
        .eq('id', playerId)
        .single()

      if (buyerErr || !buyer || (buyer.balance || 0) < totalCost) {
        return NextResponse.json({
          error: `Insufficient balance. You need ${totalCost.toLocaleString()} CR to buy ${shares_count} shares (Your balance: ${(buyer?.balance || 0).toLocaleString()} CR).`
        }, { status: 400 })
      }

      // Deduct buyer balance
      await supabase
        .from('players')
        .update({ balance: (buyer.balance || 0) - totalCost })
        .eq('id', playerId)

      // Add funds to franchise budget
      await supabase
        .from('franchises')
        .update({ budget: (franchise.budget || 0) + totalCost })
        .eq('id', franchise_id)

      // Assign shares to buyer
      const { data: buyerShares } = await supabase
        .from('franchise_shares')
        .select('*')
        .eq('franchise_id', franchise_id)
        .eq('owner_id', playerId)
        .single()

      if (buyerShares) {
        await supabase
          .from('franchise_shares')
          .update({ shares_count: buyerShares.shares_count + shares_count })
          .eq('id', buyerShares.id)
      } else {
        await supabase
          .from('franchise_shares')
          .insert([{
            franchise_id,
            owner_id: playerId,
            shares_count
          }])
      }

      // Record buy transaction for P&L tracking
      await supabase.from('franchise_share_transactions').insert([{
        player_id: playerId,
        franchise_id,
        type: 'buy',
        shares_count,
        price_per_share: sharePrice,
        total_amount: totalCost
      }])

      // Check for majority takeover
      const takenOver = await checkMajorityTakeover(playerId, franchise_id)
      const takeoverMsg = takenOver
        ? ` 🏆 You now own the majority of ${takenOver} — you are the new franchise owner!`
        : ''

      return NextResponse.json({
        success: true,
        takeover: !!takenOver,
        message: `Successfully bought ${shares_count} shares of ${franchise.name} for ${totalCost.toLocaleString()} CR!${takeoverMsg}`
      })
    } else if (action === 'sell_instant') {
      const { franchise_id, shares_count } = body

      if (!franchise_id || !shares_count || shares_count <= 0) {
        return NextResponse.json({ error: 'Invalid franchise_id or shares_count' }, { status: 400 })
      }

      // Check owned shares
      const { data: userShare, error: shareErr } = await supabase
        .from('franchise_shares')
        .select('*')
        .eq('franchise_id', franchise_id)
        .eq('owner_id', playerId)
        .single()

      if (shareErr || !userShare || userShare.shares_count < shares_count) {
        return NextResponse.json({
          error: `Insufficient shares. You currently own ${userShare?.shares_count || 0} shares.`
        }, { status: 400 })
      }

      // Fetch franchise for current valuation
      const { data: franchise, error: fErr } = await supabase
        .from('franchises')
        .select('*')
        .eq('id', franchise_id)
        .single()

      if (fErr || !franchise) {
        return NextResponse.json({ error: 'Franchise not found' }, { status: 404 })
      }

      // Calculate share price
      const { data: roster } = await supabase.from('players').select('value').eq('franchise_id', franchise_id)
      const totalRosterValue = (roster || []).reduce((sum, p) => sum + (p.value || 0), 0)
      const valuation = (franchise.budget || 0) + totalRosterValue + ((franchise.wins || 0) * 2500)
      const sharePrice = Math.max(100, Math.floor(valuation / 100))
      const totalPayout = shares_count * sharePrice

      // 1. Deduct shares from user
      await supabase
        .from('franchise_shares')
        .update({ shares_count: userShare.shares_count - shares_count })
        .eq('id', userShare.id)

      // 2. Add CR payout to user balance
      const { data: userPlayer } = await supabase.from('players').select('balance').eq('id', playerId).single()
      const newBalance = (userPlayer?.balance || 0) + totalPayout
      await supabase.from('players').update({ balance: newBalance }).eq('id', playerId)

      // 3. Record sell transaction for P&L tracking
      await supabase.from('franchise_share_transactions').insert([{
        player_id: playerId,
        franchise_id,
        type: 'sell',
        shares_count,
        price_per_share: sharePrice,
        total_amount: totalPayout
      }])

      return NextResponse.json({
        success: true,
        new_balance: newBalance,
        message: `Successfully sold ${shares_count} shares of ${franchise.name} for ${totalPayout.toLocaleString()} CR!`
      })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
