import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'

// GET /api/franchise/shares - Fetch all franchise share valuations, listings, and user holdings
export async function GET(request: NextRequest) {
  try {
    const tokenCookie = request.cookies.get('player_token')
    const playerId = tokenCookie?.value

    // 1. Fetch franchises, players, and active listings
    const [fRes, pRes, lRes, sRes] = await Promise.all([
      supabase.from('franchises').select('*'),
      supabase.from('players').select('id, name, value, franchise_id, is_franchise_owner, owned_franchise_id'),
      supabase.from('franchise_share_listings').select('*, seller:players!franchise_share_listings_seller_id_fkey(id, name), franchise:franchises!franchise_share_listings_franchise_id_fkey(id, name, logo_url)').eq('status', 'active'),
      supabase.from('franchise_shares').select('*, owner:players!franchise_shares_owner_id_fkey(id, name), franchise:franchises!franchise_shares_franchise_id_fkey(id, name, logo_url)')
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
    const tokenCookie = request.cookies.get('player_token')
    if (!tokenCookie) {
      return NextResponse.json({ error: 'Unauthorized. Please login as a player.' }, { status: 401 })
    }
    const playerId = tokenCookie.value

    const body = await request.json()
    const { action } = body

    if (action === 'list') {
      const { franchise_id, shares_count, price_per_share } = body

      if (!franchise_id || !shares_count || shares_count <= 0 || !price_per_share || price_per_share <= 0) {
        return NextResponse.json({ error: 'Invalid share listing parameters' }, { status: 400 })
      }

      // 1. Verify user owns enough shares in franchise
      const { data: userShare, error: shareErr } = await supabase
        .from('franchise_shares')
        .select('*')
        .eq('franchise_id', franchise_id)
        .eq('owner_id', playerId)
        .single()

      if (shareErr || !userShare || userShare.shares_count < shares_count) {
        return NextResponse.json({ error: 'Insufficient shares owned to list this amount.' }, { status: 400 })
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

      return NextResponse.json({ success: true, message: `Successfully purchased ${listing.shares_count} shares for ${totalCost.toLocaleString()} CR!` })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
