import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const franchiseId = request.cookies.get('franchise_token')?.value

  if (!franchiseId) {
    return NextResponse.json({ error: 'Not authenticated as a franchise owner' }, { status: 401 })
  }

  try {
    const { playerId, wage } = await request.json()
    if (!playerId || !wage || isNaN(wage) || Number(wage) < 100) {
      return NextResponse.json({ error: 'Player ID and a valid daily wage (minimum 100 CR) are required' }, { status: 400 })
    }
    const playerWage = Number(wage)

    // Get player details
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single()

    if (playerError || !player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    if (!player.available || player.status !== 'active') {
      return NextResponse.json({ error: 'Player is not available for signing' }, { status: 400 })
    }

    // Get franchise details
    const { data: franchise, error: franchiseError } = await supabase
      .from('franchises')
      .select('*')
      .eq('id', franchiseId)
      .single()

    if (franchiseError || !franchise) {
      return NextResponse.json({ error: 'Franchise not found' }, { status: 404 })
    }

    const playerValue = player.value || 0
    if (franchise.budget < playerValue) {
      return NextResponse.json({ error: 'Insufficient budget to sign this player' }, { status: 400 })
    }

    // Update franchise budget
    const newBudget = franchise.budget - playerValue
    const { error: updateFranchiseError } = await supabase
      .from('franchises')
      .update({ budget: newBudget })
      .eq('id', franchiseId)

    if (updateFranchiseError) {
      return NextResponse.json({ error: 'Failed to update franchise budget' }, { status: 500 })
    }

    // Update player status and set wages
    const { error: updatePlayerError } = await supabase
      .from('players')
      .update({ available: false, franchise_id: franchiseId, wages: playerWage })
      .eq('id', playerId)

    if (updatePlayerError) {
      // Rollback franchise budget update
      await supabase
        .from('franchises')
        .update({ budget: franchise.budget })
        .eq('id', franchiseId)

      return NextResponse.json({ error: 'Failed to assign player to franchise' }, { status: 500 })
    }

    return NextResponse.json({ success: true, newBudget })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
