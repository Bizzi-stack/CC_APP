import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'

// GET /api/franchise/shares/pnl - Return P&L summary for logged-in player
export async function GET(request: NextRequest) {
  try {
    const playerToken = request.cookies.get('player_token')?.value
    if (!playerToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all transactions for this player
    const { data: transactions, error: txErr } = await supabase
      .from('franchise_share_transactions')
      .select('*, franchise:franchises!franchise_id(id, name, logo_url)')
      .eq('player_id', playerToken)
      .order('created_at', { ascending: true })

    if (txErr) throw txErr

    // Fetch current share prices via the shares endpoint calculation
    const { data: franchisesRaw } = await supabase.from('franchises').select('*')
    const { data: players } = await supabase.from('players').select('id, value, franchise_id')

    const franchises = franchisesRaw || []
    const allPlayers = players || []

    // Build share price map
    const sharePriceMap: Record<string, number> = {}
    for (const f of franchises) {
      const roster = allPlayers.filter(p => p.franchise_id === f.id)
      const totalRosterValue = roster.reduce((sum, p) => sum + (p.value || 0), 0)
      const valuation = (f.budget || 0) + totalRosterValue + ((f.wins || 0) * 2500)
      sharePriceMap[f.id] = Math.max(100, Math.floor(valuation / 100))
    }

    // Fetch current shares held
    const { data: heldShares } = await supabase
      .from('franchise_shares')
      .select('franchise_id, shares_count')
      .eq('owner_id', playerToken)

    const heldMap: Record<string, number> = {}
    for (const s of heldShares || []) {
      heldMap[s.franchise_id] = s.shares_count
    }

    // Group transactions by franchise and compute P&L
    const pnlByFranchise: Record<string, {
      franchise_id: string
      franchise_name: string
      franchise_logo: string | null
      total_invested: number
      total_received: number
      shares_held: number
      current_price: number
      current_value: number
      unrealised_pnl: number
      realised_pnl: number
      avg_buy_price: number
      transactions: any[]
    }> = {}

    for (const tx of transactions || []) {
      const fid = tx.franchise_id
      if (!pnlByFranchise[fid]) {
        pnlByFranchise[fid] = {
          franchise_id: fid,
          franchise_name: tx.franchise?.name || 'Unknown',
          franchise_logo: tx.franchise?.logo_url || null,
          total_invested: 0,
          total_received: 0,
          shares_held: heldMap[fid] || 0,
          current_price: sharePriceMap[fid] || 0,
          current_value: 0,
          unrealised_pnl: 0,
          realised_pnl: 0,
          avg_buy_price: 0,
          transactions: []
        }
      }

      if (tx.type === 'buy') {
        pnlByFranchise[fid].total_invested += tx.total_amount
      } else {
        pnlByFranchise[fid].total_received += tx.total_amount
      }

      pnlByFranchise[fid].transactions.push({
        id: tx.id,
        type: tx.type,
        shares_count: tx.shares_count,
        price_per_share: tx.price_per_share,
        total_amount: tx.total_amount,
        created_at: tx.created_at
      })
    }

    // Compute derived fields for each franchise
    for (const item of Object.values(pnlByFranchise)) {
      const totalBuyTxs = item.transactions.filter(t => t.type === 'buy')
      const totalSharesBought = totalBuyTxs.reduce((s, t) => s + t.shares_count, 0)
      item.avg_buy_price = totalSharesBought > 0
        ? Math.floor(item.total_invested / totalSharesBought)
        : 0

      item.current_value = item.shares_held * item.current_price

      // Net cost basis for currently held shares
      const costBasisOfHeld = item.shares_held * item.avg_buy_price
      item.unrealised_pnl = item.current_value - costBasisOfHeld

      // Realised P&L: cash received from sells minus avg cost of shares sold
      const totalSharesSold = item.transactions
        .filter(t => t.type === 'sell')
        .reduce((s, t) => s + t.shares_count, 0)
      const costOfSold = totalSharesSold * item.avg_buy_price
      item.realised_pnl = item.total_received - costOfSold
    }

    const summary = Object.values(pnlByFranchise)

    return NextResponse.json({ pnl: summary, transactions: transactions || [] })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
