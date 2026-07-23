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
      // Winner takes all (both wagers)
      const totalPot = challenge.wager_amount * 2

      if (totalPot > 0) {
        const { data: winner } = await supabase
          .from('franchises')
          .select('budget')
          .eq('id', winner_id)
          .single()

        if (winner) {
          await supabase
            .from('franchises')
            .update({ budget: winner.budget + totalPot })
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
