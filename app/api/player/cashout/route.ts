import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { fetchLiveBtcPrice } from '@/lib/btc'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const playerId = request.cookies.get('player_token')?.value

  if (!playerId) {
    return NextResponse.json({ error: 'Not authenticated as a player' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const btcAddress = body.btc_address?.trim()
    const crAmount = parseInt(body.cr_amount) || 1000000

    if (!btcAddress) {
      return NextResponse.json({ error: 'Bitcoin wallet address is required' }, { status: 400 })
    }

    if (crAmount < 1000000) {
      return NextResponse.json({ error: 'Minimum cashout is 1,000,000 CR ($50 USD in BTC)' }, { status: 400 })
    }

    // Fetch player profile to verify balance
    const { data: player, error: playerErr } = await supabase
      .from('players')
      .select('id, name, balance, value')
      .eq('id', playerId)
      .single()

    if (playerErr || !player) {
      return NextResponse.json({ error: 'Player profile not found' }, { status: 404 })
    }

    // Check balance (checking balance column first, or value if using earnings)
    const currentBalance = player.balance !== undefined && player.balance !== null ? Number(player.balance) : Number(player.value || 0)

    if (currentBalance < crAmount) {
      return NextResponse.json({
        error: `Insufficient balance. You need ${crAmount.toLocaleString()} CR to cash out $50 USD in BTC (Your balance: ${currentBalance.toLocaleString()} CR)`
      }, { status: 400 })
    }

    // Fetch live BTC price
    const btcInfo = await fetchLiveBtcPrice()
    const usdValue = (crAmount / 1000000) * 50.00
    const btcAmount = usdValue / btcInfo.priceUsd
    const newBalance = currentBalance - crAmount

    // Deduct CR balance from player
    const { error: updateErr } = await supabase
      .from('players')
      .update({ balance: newBalance })
      .eq('id', playerId)

    if (updateErr) {
      return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 })
    }

    // Record cashout request
    const { data: cashout, error: cashoutErr } = await supabase
      .from('cashout_requests')
      .insert([{
        player_id: playerId,
        cr_amount: crAmount,
        usd_value: usdValue,
        btc_amount: btcAmount,
        btc_price_usd: btcInfo.priceUsd,
        btc_address: btcAddress,
        status: 'pending'
      }])
      .select()
      .single()

    if (cashoutErr) {
      console.error('Cashout insert error:', cashoutErr)
    }

    return NextResponse.json({
      success: true,
      new_balance: newBalance,
      cr_amount: crAmount,
      usd_value: usdValue,
      btc_amount: btcAmount,
      btc_price_usd: btcInfo.priceUsd,
      btc_address: btcAddress,
      cashout
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Invalid request' }, { status: 400 })
  }
}

export async function GET(request: NextRequest) {
  const playerId = request.cookies.get('player_token')?.value

  if (!playerId) {
    return NextResponse.json({ error: 'Not authenticated as a player' }, { status: 401 })
  }

  try {
    const { data: cashouts, error } = await supabase
      .from('cashout_requests')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ cashouts: cashouts || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch cashout history' }, { status: 500 })
  }
}
