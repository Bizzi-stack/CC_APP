import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const playerId = request.cookies.get('player_token')?.value

  if (!playerId) {
    return NextResponse.json({ error: 'Not authenticated as a player' }, { status: 401 })
  }

  // Check if today is Friday (Day 5 in JavaScript: 0=Sun, 5=Fri)
  const now = new Date()
  const isFriday = now.getDay() === 5

  const { searchParams } = new URL(request.url)
  const isBypass = searchParams.get('bypass') === 'true'

  if (!isFriday && !isBypass) {
    return NextResponse.json({ error: 'Friday Micro-Loans are only available on Fridays!' }, { status: 400 })
  }

  // Fetch player details
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('*')
    .eq('id', playerId)
    .single()

  if (playerError || !player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  }

  if (player.loan_balance && player.loan_balance > 0) {
    return NextResponse.json({ error: `You already have an active loan of ${player.loan_balance} CR. Pay it off first!` }, { status: 400 })
  }

  if ((player.balance || 0) >= 1000) {
    return NextResponse.json({ error: 'Friday Loans are reserved for players with less than 1,000 CR.' }, { status: 400 })
  }

  const loanAmount = 1000
  const newBalance = (player.balance || 0) + loanAmount

  const { error: updateError } = await supabase
    .from('players')
    .update({
      balance: newBalance,
      loan_balance: loanAmount
    })
    .eq('id', playerId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    loanAmount,
    newBalance,
    loanBalance: loanAmount
  })
}
