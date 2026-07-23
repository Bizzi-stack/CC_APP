import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/franchise/challenges - Fetch active and pending challenges for logged-in franchise
export async function GET(request: NextRequest) {
  const franchiseId = request.cookies.get('franchise_token')?.value

  if (!franchiseId) {
    return NextResponse.json({ error: 'Not authenticated as a franchise' }, { status: 401 })
  }

  // Get challenges where this franchise is either challenger or challenged
  const { data: challenges, error } = await supabase
    .from('franchise_challenges')
    .select(`
      *,
      challenger:franchises!franchise_challenges_challenger_id_fkey(id, name, logo_url),
      challenged:franchises!franchise_challenges_challenged_id_fkey(id, name, logo_url)
    `)
    .or(`challenger_id.eq.${franchiseId},challenged_id.eq.${franchiseId}`)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch challenges' }, { status: 500 })
  }

  return NextResponse.json({ challenges })
}

// POST /api/franchise/challenges - Create a new challenge (deducts wager)
export async function POST(request: NextRequest) {
  const franchiseId = request.cookies.get('franchise_token')?.value

  if (!franchiseId) {
    return NextResponse.json({ error: 'Not authenticated as a franchise' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { challenged_id, wager_amount } = body

    if (!challenged_id || wager_amount === undefined || wager_amount < 0) {
      return NextResponse.json({ error: 'Invalid challenge data' }, { status: 400 })
    }

    if (challenged_id === franchiseId) {
      return NextResponse.json({ error: 'Cannot challenge yourself' }, { status: 400 })
    }

    // Check if challenger has enough budget
    const { data: challenger, error: cError } = await supabase
      .from('franchises')
      .select('budget')
      .eq('id', franchiseId)
      .single()

    if (cError || !challenger) {
      return NextResponse.json({ error: 'Franchise not found' }, { status: 404 })
    }

    if (challenger.budget < wager_amount) {
      return NextResponse.json({ error: 'Insufficient budget for wager' }, { status: 400 })
    }

    // Create the challenge
    const { data: challenge, error: challengeError } = await supabase
      .from('franchise_challenges')
      .insert({
        challenger_id: franchiseId,
        challenged_id,
        wager_amount,
        status: 'pending'
      })
      .select()
      .single()

    if (challengeError || !challenge) {
      throw challengeError || new Error('Failed to create challenge')
    }

    // Deduct wager from challenger (escrow)
    if (wager_amount > 0) {
      await supabase
        .from('franchises')
        .update({ budget: challenger.budget - wager_amount })
        .eq('id', franchiseId)
    }

    return NextResponse.json({ success: true, challenge })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to create challenge' }, { status: 500 })
  }
}
