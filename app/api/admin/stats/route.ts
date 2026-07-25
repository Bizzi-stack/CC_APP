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

      // Fetch old stats first to calculate difference
      const { data: oldPlayer, error: fetchError } = await supabase
        .from('players')
        .select('goals, assists, value')
        .eq('id', id)
        .single()
      
      if (fetchError) throw fetchError

      const oldGoals = oldPlayer.goals || 0
      const oldAssists = oldPlayer.assists || 0
      const oldValue = oldPlayer.value || 0
      
      let valueBump = 0
      let reasons = []

      if (goals !== undefined && goals > oldGoals) {
        const diff = goals - oldGoals
        valueBump += diff * 500
        reasons.push(`+${diff} Goal${diff > 1 ? 's' : ''}`)
      }
      if (assists !== undefined && assists > oldAssists) {
        const diff = assists - oldAssists
        valueBump += diff * 250
        reasons.push(`+${diff} Assist${diff > 1 ? 's' : ''}`)
      }

      const dataToUpdate: any = {}
      if (goals !== undefined) dataToUpdate.goals = goals
      if (assists !== undefined) dataToUpdate.assists = assists

      if (valueBump > 0) {
        dataToUpdate.value = oldValue + valueBump
      }

      const { error } = await supabase.from('players').update(dataToUpdate).eq('id', id)
      if (error) throw error

      if (valueBump > 0) {
        await supabase.from('player_value_history').insert([{
          player_id: id,
          old_value: oldValue,
          new_value: oldValue + valueBump,
          change_reason: reasons.join(', ')
        }])
      }
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
