import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { calculatePlayerPoints, calculateTransfersUsed, MAX_WEEKLY_TRANSFERS } from '@/lib/fantasy'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

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

    // 1. Fetch picks for this team & gameweek
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

    // 2. Fetch baseline squad from previous gameweeks if gameweek > 1
    let baselinePlayerIds: string[] = []
    let isCarriedOver = false
    let picksToUse = picks || []

    if (gameweek > 1) {
      const { data: prevPicks } = await db
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
        .lt('gameweek', gameweek)
        .order('gameweek', { ascending: false })

      if (prevPicks && prevPicks.length > 0) {
        const latestPrevGw = prevPicks[0].gameweek
        const latestPicks = prevPicks.filter((p: any) => p.gameweek === latestPrevGw)
        baselinePlayerIds = latestPicks.map((p: any) => p.player_id)

        // If no explicit picks saved yet for current gameweek, carry over previous squad!
        if (picksToUse.length === 0) {
          picksToUse = latestPicks.map((p: any) => ({
            ...p,
            gameweek,
            is_carried_over: true
          }))
          isCarriedOver = true
        }
      }
    } else {
      // In GW1, baseline is current picks
      baselinePlayerIds = (picks || []).map((p: any) => p.player_id)
    }

    // Active chip for this gameweek (from picks or team default)
    const activeChip = (picksToUse && picksToUse.length > 0 && picksToUse[0].active_chip) 
      ? picksToUse[0].active_chip 
      : (team.active_chip || 'NONE')

    const usedChips: string[] = team.used_chips || []
    const rebuildUsed = usedChips.includes('FULL_REBUILD')
    const isFullRebuild = activeChip === 'FULL_REBUILD' || (picksToUse && picksToUse.length > 0 && picksToUse[0].active_chip === 'FULL_REBUILD')

    // Fetch fantasy stats for these players in this gameweek if any
    const playerIds = (picksToUse || []).map((p: any) => p.player_id)
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
    const processedPicks = (picksToUse || []).map((pick: any) => {
      const player = pick.players
      const stat = statsMap[pick.player_id] || {
        goals: 0,
        assists: 0,
        clean_sheet: false,
        minutes_played: 0,
        bonus_points: 0
      }

      let pts = calculatePlayerPoints(pick.position_slot?.startsWith('SUB') ? player?.position : pick.position_slot, stat)
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
        active_chip: activeChip,
        used_chips: usedChips,
        rebuild_used: rebuildUsed,
        is_full_rebuild: isFullRebuild
      },
      gameweek,
      total_gameweek_points: totalGameweekPoints,
      picks: processedPicks,
      baseline_player_ids: baselinePlayerIds,
      is_carried_over: isCarriedOver
    })
  } catch (error: any) {
    console.error('Error fetching fantasy team:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_identifier,
      team_name,
      manager_name,
      formation = '3-3-1',
      active_chip = 'NONE',
      is_full_rebuild = false,
      gameweek = 1,
      picks
    } = body

    if (!user_identifier || !team_name || !manager_name) {
      return NextResponse.json({ error: 'Team name, Manager name, and User ID are required' }, { status: 400 })
    }

    // 0. Check Gameweek Deadline
    const { data: gwData } = await db
      .from('fantasy_gameweeks')
      .select('deadline')
      .eq('id', gameweek)
      .single()

    if (gwData && gwData.deadline) {
      const deadlineDate = new Date(gwData.deadline)
      if (new Date() > deadlineDate) {
        return NextResponse.json({ 
          error: 'The deadline for this gameweek has passed. Squad changes are locked.' 
        }, { status: 403 })
      }
    }

    // 1. Find or create fantasy team
    const { data: existingTeams, error: findError } = await db
      .from('fantasy_teams')
      .select('*')
      .eq('user_identifier', user_identifier)

    if (findError) throw findError

    let teamId: string
    let usedChips: string[] = []

    if (existingTeams && existingTeams.length > 0) {
      teamId = existingTeams[0].id
      usedChips = existingTeams[0].used_chips || []
    } else {
      const { data: newTeam, error: createError } = await db
        .from('fantasy_teams')
        .insert([{
          user_identifier,
          team_name,
          manager_name,
          formation,
          active_chip: is_full_rebuild ? 'FULL_REBUILD' : active_chip,
          used_chips: is_full_rebuild ? ['FULL_REBUILD'] : []
        }])
        .select()
        .single()

      if (createError) throw createError
      teamId = newTeam.id
      usedChips = is_full_rebuild ? ['FULL_REBUILD'] : []
    }

    // 2. Validate transfer rules for Gameweek 2 onwards
    if (gameweek > 1) {
      if (is_full_rebuild) {
        // Check if FULL_REBUILD was already used in an earlier gameweek
        const { data: pastRebuildPicks } = await db
          .from('fantasy_squad_picks')
          .select('gameweek')
          .eq('fantasy_team_id', teamId)
          .eq('active_chip', 'FULL_REBUILD')
          .lt('gameweek', gameweek)
          .limit(1)

        if (pastRebuildPicks && pastRebuildPicks.length > 0) {
          return NextResponse.json({
            error: '1-Time Full Squad Rebuild has already been used in a previous gameweek and cannot be used again.'
          }, { status: 400 })
        }

        if (!usedChips.includes('FULL_REBUILD')) {
          usedChips = [...usedChips, 'FULL_REBUILD']
        }
      } else {
        // Normal weekly transfer validation
        if (Array.isArray(picks)) {
          if (picks.length === 0) {
            return NextResponse.json({
              error: 'You can only clear your entire squad after Gameweek 1 by using your 1-Time Full Squad Rebuild.'
            }, { status: 400 })
          }

          // Fetch baseline squad from previous gameweek
          const { data: prevPicks } = await db
            .from('fantasy_squad_picks')
            .select('gameweek, player_id')
            .eq('fantasy_team_id', teamId)
            .lt('gameweek', gameweek)
            .order('gameweek', { ascending: false })

          if (prevPicks && prevPicks.length > 0) {
            const latestPrevGw = prevPicks[0].gameweek
            const basePlayerIds = prevPicks
              .filter((p: any) => p.gameweek === latestPrevGw)
              .map((p: any) => p.player_id)

            const currentPicksPlayerIds = picks.map((p: any) => p.player_id)
            const transfersUsed = calculateTransfersUsed(basePlayerIds, currentPicksPlayerIds)

            if (transfersUsed > MAX_WEEKLY_TRANSFERS) {
              return NextResponse.json({
                error: `Transfer limit exceeded: You attempted ${transfersUsed} transfers. Only up to ${MAX_WEEKLY_TRANSFERS} player transfers are allowed per gameweek without your 1-Time Full Squad Rebuild.`
              }, { status: 400 })
            }
          }
        }
      }
    }

    const finalActiveChip = is_full_rebuild ? 'FULL_REBUILD' : active_chip

    // 3. Update team metadata
    await db
      .from('fantasy_teams')
      .update({
        team_name,
        manager_name,
        formation,
        active_chip: finalActiveChip,
        used_chips: usedChips,
        updated_at: new Date().toISOString()
      })
      .eq('id', teamId)

    // 4. Save squad picks
    if (Array.isArray(picks)) {
      // Clear old picks for this gameweek
      await db
        .from('fantasy_squad_picks')
        .delete()
        .eq('fantasy_team_id', teamId)
        .eq('gameweek', gameweek)

      if (picks.length > 0) {
        const picksToInsert = picks.map((p: any) => ({
          fantasy_team_id: teamId,
          gameweek: gameweek,
          player_id: p.player_id,
          position_slot: p.position_slot,
          is_captain: Boolean(p.is_captain),
          is_vice_captain: Boolean(p.is_vice_captain),
          active_chip: finalActiveChip
        }))

        const { error: insertError } = await db
          .from('fantasy_squad_picks')
          .insert(picksToInsert)

        if (insertError) throw insertError
      }
    }

    return NextResponse.json({
      success: true,
      team_id: teamId,
      used_chips: usedChips,
      rebuild_used: usedChips.includes('FULL_REBUILD'),
      message: 'Fantasy lineup saved successfully'
    })
  } catch (error: any) {
    console.error('Error saving fantasy team:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

