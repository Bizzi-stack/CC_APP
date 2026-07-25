import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const playerId = request.cookies.get('player_token')?.value

  if (!playerId) {
    return NextResponse.json({ error: 'Not authenticated as a player' }, { status: 401 })
  }

  // Fetch player profile
  const { data: player, error: playerError } = await supabase
    .from('players')
    .select('*')
    .eq('id', playerId)
    .single()

  if (playerError || !player) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  }

  const baseWage = player.wages || 500

  const now = new Date()
  let currentStreak = player.wage_streak || 0

  if (player.last_wage_collection) {
    const lastCollection = new Date(player.last_wage_collection)
    const diffMs = now.getTime() - lastCollection.getTime()
    const hoursPassed = diffMs / (1000 * 60 * 60)

    if (hoursPassed < 24) {
      const hoursRemaining = Math.ceil(24 - hoursPassed)
      return NextResponse.json({
        error: `Wages already collected today. Please wait ${hoursRemaining} hour(s) to collect again.`
      }, { status: 429 })
    }

    // If within 48 hours, maintain & increment streak; otherwise reset
    if (hoursPassed <= 48) {
      currentStreak = Math.min(7, currentStreak + 1)
    } else {
      currentStreak = 1
    }
  } else {
    currentStreak = 1
  }

  // Calculate Streak Bonus (+10% per streak level)
  const streakMultiplier = 1 + (currentStreak - 1) * 0.1
  const wageWithStreak = Math.floor(baseWage * streakMultiplier)

  // 10% Chance for Lucky Jackpot Drop (+1,500 CR)
  const isJackpot = Math.random() < 0.10
  const jackpotAmount = isJackpot ? 1500 : 0

  const totalEarned = wageWithStreak + jackpotAmount

  // Handle Franchise Deduction
  if (player.franchise_id) {
    const { data: franchise } = await supabase
      .from('franchises')
      .select('budget')
      .eq('id', player.franchise_id)
      .single()

    if (franchise) {
      await supabase
        .from('franchises')
        .update({ budget: franchise.budget - baseWage })
        .eq('id', player.franchise_id)
    }
  }

  // Auto-repay loan if active
  let currentLoan = player.loan_balance || 0
  let loanRepaid = 0
  let addedToBalance = totalEarned

  if (currentLoan > 0) {
    if (totalEarned >= currentLoan) {
      loanRepaid = currentLoan
      addedToBalance = totalEarned - currentLoan
      currentLoan = 0
    } else {
      loanRepaid = totalEarned
      addedToBalance = 0
      currentLoan = currentLoan - totalEarned
    }
  }

  const newBalance = (player.balance || 0) + addedToBalance

  const { error: updateError } = await supabase
    .from('players')
    .update({
      balance: newBalance,
      loan_balance: currentLoan,
      wage_streak: currentStreak,
      last_wage_collection: now.toISOString()
    })
    .eq('id', playerId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    baseWage,
    wageWithStreak,
    streak: currentStreak,
    isJackpot,
    jackpotAmount,
    totalEarned,
    loanRepaid,
    remainingLoan: currentLoan,
    addedToBalance,
    newBalance
  })
}
