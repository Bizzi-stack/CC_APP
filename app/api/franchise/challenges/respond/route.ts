import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST /api/franchise/challenges/respond - Accept or reject a challenge
export async function POST(request: NextRequest) {
  const franchiseId = request.cookies.get('franchise_token')?.value

  if (!franchiseId) {
    return NextResponse.json({ error: 'Not authenticated as a franchise' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { challenge_id, action } = body // action: 'accept' | 'reject' | 'cancel'

    if (!challenge_id || !['accept', 'reject', 'cancel'].includes(action)) {
      return NextResponse.json({ error: 'Invalid response data' }, { status: 400 })
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

    if (challenge.status !== 'pending') {
      return NextResponse.json({ error: 'Challenge is no longer pending' }, { status: 400 })
    }

    // Determine permissions
    if (action === 'cancel' && challenge.challenger_id !== franchiseId) {
      return NextResponse.json({ error: 'Only challenger can cancel' }, { status: 403 })
    }
    if ((action === 'accept' || action === 'reject') && challenge.challenged_id !== franchiseId) {
      return NextResponse.json({ error: 'Only challenged franchise can respond' }, { status: 403 })
    }

    if (action === 'accept') {
      // Check if challenged team has enough budget
      const { data: challenged, error: chError } = await supabase
        .from('franchises')
        .select('budget')
        .eq('id', franchiseId)
        .single()

      if (chError || !challenged) {
        return NextResponse.json({ error: 'Franchise not found' }, { status: 404 })
      }

      if (challenged.budget < challenge.wager_amount) {
        return NextResponse.json({ error: 'Insufficient budget to accept wager' }, { status: 400 })
      }

      // Deduct wager from challenged (escrow)
      if (challenge.wager_amount > 0) {
        await supabase
          .from('franchises')
          .update({ budget: challenged.budget - challenge.wager_amount })
          .eq('id', franchiseId)
      }

      // Update challenge status
      await supabase
        .from('franchise_challenges')
        .update({ status: 'accepted' })
        .eq('id', challenge_id)

    } else if (action === 'reject' || action === 'cancel') {
      // Refund the challenger's escrow
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
      }

      // Update challenge status
      await supabase
        .from('franchise_challenges')
        .update({ status: action === 'reject' ? 'rejected' : 'canceled' })
        .eq('id', challenge_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to respond to challenge' }, { status: 500 })
  }
}
