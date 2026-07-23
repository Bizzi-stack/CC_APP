import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const { type, id, updates } = await request.json()
    
    if (!type || !id || !updates) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (type === 'player') {
      // Allowed updates for players
      const { goals, assists } = updates
      const dataToUpdate: any = {}
      if (goals !== undefined) dataToUpdate.goals = goals
      if (assists !== undefined) dataToUpdate.assists = assists

      const { error } = await supabase.from('players').update(dataToUpdate).eq('id', id)
      if (error) throw error
    } else if (type === 'franchise') {
      // Allowed updates for franchises
      const { wins, draws, losses, goals_for, goals_against } = updates
      const dataToUpdate: any = {}
      if (wins !== undefined) dataToUpdate.wins = wins
      if (draws !== undefined) dataToUpdate.draws = draws
      if (losses !== undefined) dataToUpdate.losses = losses
      if (goals_for !== undefined) dataToUpdate.goals_for = goals_for
      if (goals_against !== undefined) dataToUpdate.goals_against = goals_against

      const { error } = await supabase.from('franchises').update(dataToUpdate).eq('id', id)
      if (error) throw error
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
