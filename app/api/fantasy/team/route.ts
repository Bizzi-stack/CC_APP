import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { calculatePlayerPoints } from '@/lib/fantasy'

export const dynamic = 'force-dynamic'

const db = supabaseAdmin || supabase

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userIdentifier = searchParams.get('user_identifier')
    const teamId = searchParams.get('team_id')
    const gameweek = parseInt(searchParams.get('gameweek') || '1')

    if (!userIdentifier && !teamId) {
      return NextResponse.json({ team: null, picks: [] })
    }

    let teamQuery = db.from('fantasy_teams').select('*')
    if (teamId) {
      teamQuery = teamQuery.eq('id', teamId)
    } else if (userIdentifier) {
      teamQuery = teamQuery.eq('user_identifier', userIdentifier)
    }

    const { data: teams, error: teamError } = await teamQuery
    if (teamError) throw teamError

    const team = teams && teams.length > 0 ? teams[0] : null
    if (!team) {
      return NextResponse.json({ team: null, picks: [] })
    }

    // Fetch picks for this team & gameweek
    const { data: picks, error: picksError } = await db
      .from('fantasy_squad_picks')
      .select(`
        id,
        gameweek,
        position_slot,
        is_captain,
        is_vice_captain,
        active_chip,
        player_id,
        players (
          id,
          name,
          position,
          photo_url,
          country,
          franchise_id,
          goals,
          assists,
          franchises:franchises!players_franchise_id_fkey (
            id,
            name,
            logo_url
          )
        )
      `)
      .eq('fantasy_team_id', team.id)
      .eq('gameweek', gameweek)

    if (picksError) throw picksError

    // Active chip for this gameweek (from picks or team default)
    const activeChip = (picks && picks.length > 0 && picks[0].active_chip) 
      ? picks[0].active_chip 
      : (team.active_chip || 'NONE')

    // Fetch fantasy stats for these players in this gameweek if any
    const playerIds = (picks || []).map((p: any) => p.player_id)
    let statsMap: Record<string, any> = {}
    if (playerIds.length > 0) {
      const { data: statsData } = await db
        .from('fantasy_player_stats')
        .select('*')
        .eq('gameweek', gameweek)
        .in('player_id', playerIds)

      if (statsData) {
        statsData.forEach((s: any) => {
          statsMap[s.player_id] = s
        })
      }
    }

    // Calculate points for each pick with Triple Captain and Bench Boost rules
    let totalGameweekPoints = 0
    const processedPicks = (picks || []).map((pick: any) => {
      const player = pick.players
      const stat = statsMap[pick.player_id] || {
        goals: player?.goals || 0,
        assists: player?.assists || 0,
        clean_sheet: false,
        minutes_played: (player?.goals || player?.assists) ? 90 : 0,
        bonus_points: 0
      }

      let pts = calculatePlayerPoints(player?.position, stat)
      if (pick.is_captain) {
        // Triple Captain (3x) vs Normal Captain (2x)
        pts *= activeChip === 'TRIPLE_CAPTAIN' ? 3 : 2
      }

      const isStarter = !pick.position_slot?.startsWith('SUB')
      const isBenchBoostActive = activeChip === 'BENCH_BOOST'

      // Include points if player is a starter OR if Bench Boost is active
      if (isStarter || isBenchBoostActive) {
        totalGameweekPoints += pts
      }

      return {
        ...pick,
        stats: stat,
        computed_points: pts
      }
    })

    return NextResponse.json({
      team: {
        ...team,
        active_chip: activeChip
      },
      gameweek,
      total_gameweek_points: totalGameweekPoints,
      picks: processedPicks
    })
  } catch (error: any) {
    console.error('Error fetching fantasy team:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_identifier, team_name, manager_name, formation = '2-2-2', active_chip = 'NONE', gameweek = 1, picks } = body

    if (!user_identifier || !team_name || !manager_name) {
      return NextResponse.json({ error: 'Team name, Manager name, and User ID are required' }, { status: 400 })
    }

    // 1. Find or create fantasy team
    const { data: existingTeams, error: findError } = await db
      .from('fantasy_teams')
      .select('*')
      .eq('user_identifier', user_identifier)

    if (findError) throw findError

    let teamId: string
    if (existingTeams && existingTeams.length > 0) {
      teamId = existingTeams[0].id
      await db
        .from('fantasy_teams')
        .update({
          team_name,
          manager_name,
          formation,
          active_chip,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId)
    } else {
      const { data: newTeam, error: createError } = await db
        .from('fantasy_teams')
        .insert([{
          user_identifier,
          team_name,
          manager_name,
          formation,
          active_chip
        }])
        .select()
        .single()

      if (createError) throw createError
      teamId = newTeam.id
    }

    // 2. Save picks if provided
    if (Array.isArray(picks) && picks.length > 0) {
      // Clear old picks for this gameweek
      await db
        .from('fantasy_squad_picks')
        .delete()
        .eq('fantasy_team_id', teamId)
        .eq('gameweek', gameweek)

      // Insert new picks with active_chip
      const picksToInsert = picks.map((p: any) => ({
        fantasy_team_id: teamId,
        gameweek: gameweek,
        player_id: p.player_id,
        position_slot: p.position_slot,
        is_captain: Boolean(p.is_captain),
        is_vice_captain: Boolean(p.is_vice_captain),
        active_chip: active_chip
      }))

      const { error: insertError } = await db
        .from('fantasy_squad_picks')
        .insert(picksToInsert)

      if (insertError) throw insertError
    }

    return NextResponse.json({
      success: true,
      team_id: teamId,
      message: 'Fantasy lineup saved successfully'
    })
  } catch (error: any) {
    console.error('Error saving fantasy team:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
