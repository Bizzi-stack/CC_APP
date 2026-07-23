import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const franchiseId = request.cookies.get('franchise_token')?.value

  if (!franchiseId) {
    return NextResponse.json({ error: 'Not authenticated as a franchise owner' }, { status: 401 })
  }

  try {
    const { playerId } = await request.json()
    if (!playerId) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 })
    }

    // Get player details
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single()

    if (playerError || !player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    if (player.franchise_id !== franchiseId) {
      return NextResponse.json({ error: 'Player is not signed to this franchise' }, { status: 400 })
    }

    if (player.is_franchise_owner && player.owned_franchise_id === franchiseId) {
      return NextResponse.json({ error: 'Cannot release the franchise owner' }, { status: 400 })
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
    const newBudget = franchise.budget + playerValue

    // Update franchise budget
    const { error: updateFranchiseError } = await supabase
      .from('franchises')
      .update({ budget: newBudget })
      .eq('id', franchiseId)

    if (updateFranchiseError) {
      return NextResponse.json({ error: 'Failed to update franchise budget' }, { status: 500 })
    }

    // Update player status (set to available and remove franchise reference)
    const { error: updatePlayerError } = await supabase
      .from('players')
      .update({ available: true, franchise_id: null })
      .eq('id', playerId)

    if (updatePlayerError) {
      // Rollback franchise budget update
      await supabase
        .from('franchises')
        .update({ budget: franchise.budget })
        .eq('id', franchiseId)

      return NextResponse.json({ error: 'Failed to release player' }, { status: 500 })
    }

    return NextResponse.json({ success: true, newBudget })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
