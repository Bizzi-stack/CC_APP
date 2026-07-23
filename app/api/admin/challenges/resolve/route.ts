import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/admin/challenges/resolve - Admin resolves a challenge and pays out wagers
export async function POST(request: NextRequest) {
  // In a real app, verify admin auth here
  // For simplicity, we assume the admin portal caller is authorized.

  try {
    const body = await request.json()
    const { challenge_id, winner_id } = body // winner_id can be null for a draw

    if (!challenge_id || winner_id === undefined) {
      return NextResponse.json({ error: 'Invalid resolve data' }, { status: 400 })
    }

    // Fetch the challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('franchise_challenges')
      .select('*')
      .eq('id', challenge_id)
      .single()

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 })
    }

    if (challenge.status !== 'accepted') {
      return NextResponse.json({ error: 'Can only resolve accepted challenges' }, { status: 400 })
    }

    // Resolve payouts
    if (winner_id) {
      // 50/50 split between franchise and roster
      const totalPot = challenge.wager_amount * 2

      if (totalPot > 0) {
        const franchiseShare = Math.floor(totalPot / 2)
        const playersShare = totalPot - franchiseShare

        // 1. Fetch winning franchise
        const { data: winner } = await supabase
          .from('franchises')
          .select('budget')
          .eq('id', winner_id)
          .single()

        // 2. Fetch winning roster
        const { data: roster } = await supabase
          .from('players')
          .select('id, balance')
          .eq('franchise_id', winner_id)

        let finalFranchisePayout = franchiseShare

        // 3. Payout players
        if (roster && roster.length > 0) {
          const perPlayerShare = Math.floor(playersShare / roster.length)
          const remainder = playersShare - (perPlayerShare * roster.length)
          finalFranchisePayout += remainder // Give remaining un-splittable credits to the franchise

          if (perPlayerShare > 0) {
            // Update all players
            for (const player of roster) {
              await supabase
                .from('players')
                .update({ balance: (player.balance || 0) + perPlayerShare })
                .eq('id', player.id)
            }
          }
        } else {
          // If no roster, franchise takes the entire pot
          finalFranchisePayout = totalPot
        }

        // 4. Payout franchise
        if (winner) {
          await supabase
            .from('franchises')
            .update({ budget: winner.budget + finalFranchisePayout })
            .eq('id', winner_id)
        }
      }
    } else {
      // Draw: Refund both
      if (challenge.wager_amount > 0) {
        const { data: challenger } = await supabase
          .from('franchises')
          .select('budget')
          .eq('id', challenge.challenger_id)
          .single()

        if (challenger) {
          await supabase
            .from('franchises')
            .update({ budget: challenger.budget + challenge.wager_amount })
            .eq('id', challenge.challenger_id)
        }

        const { data: challenged } = await supabase
          .from('franchises')
          .select('budget')
          .eq('id', challenge.challenged_id)
          .single()

        if (challenged) {
          await supabase
            .from('franchises')
            .update({ budget: challenged.budget + challenge.wager_amount })
            .eq('id', challenge.challenged_id)
        }
      }
    }

    // ============================================
    // RESOLVE PLAYER WAGERS (SPORTSBOOK)
    // ============================================
    const { data: playerWagers } = await supabase
      .from('player_wagers')
      .select('*')
      .eq('challenge_id', challenge_id)
      .eq('status', 'pending')

    if (playerWagers && playerWagers.length > 0) {
      for (const wager of playerWagers) {
        if (winner_id) {
          // A winner was declared
          if (wager.predicted_winner_id === winner_id) {
            // Player guessed correctly -> 2x payout
            const winnings = wager.wager_amount * 2
            
            // 1. Fetch current balance
            const { data: p } = await supabase.from('players').select('balance').eq('id', wager.player_id).single()
            if (p) {
              await supabase.from('players').update({ balance: (p.balance || 0) + winnings }).eq('id', wager.player_id)
            }
            // 2. Mark won
            await supabase.from('player_wagers').update({ status: 'won' }).eq('id', wager.id)
          } else {
            // Player guessed wrong
            await supabase.from('player_wagers').update({ status: 'lost' }).eq('id', wager.id)
          }
        } else {
          // Draw was declared
          if (wager.predicted_winner_id === null) {
            // Player bet on draw -> 2x payout (or 1.5x? We'll do 2x for simplicity)
            const winnings = wager.wager_amount * 2
            const { data: p } = await supabase.from('players').select('balance').eq('id', wager.player_id).single()
            if (p) {
              await supabase.from('players').update({ balance: (p.balance || 0) + winnings }).eq('id', wager.player_id)
            }
            await supabase.from('player_wagers').update({ status: 'won' }).eq('id', wager.id)
          } else {
            // Player bet on a team, match was a draw.
            // In many sportsbooks, draw means bets are lost unless it's a draw-no-bet.
            // Let's just refund them if they bet on a team and it was a draw, or count it as lost.
            // Standard: If they could have bet draw and didn't, they lost.
            await supabase.from('player_wagers').update({ status: 'lost' }).eq('id', wager.id)
          }
        }
      }
    }

    // Update challenge status
    await supabase
      .from('franchise_challenges')
      .update({ status: 'completed', winner_id })
      .eq('id', challenge_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to resolve challenge' }, { status: 500 })
  }
}

// GET /api/admin/challenges/resolve - Fetch active accepted challenges for admin
export async function GET(request: NextRequest) {
  const { data: challenges, error } = await supabase
    .from('franchise_challenges')
    .select(`
      *,
      challenger:franchises!franchise_challenges_challenger_id_fkey(id, name, logo_url),
      challenged:franchises!franchise_challenges_challenged_id_fkey(id, name, logo_url),
      winner:franchises!franchise_challenges_winner_id_fkey(id, name, logo_url)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 })
  }

  return NextResponse.json({ challenges })
}
