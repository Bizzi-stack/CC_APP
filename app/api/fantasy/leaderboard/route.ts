import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { calculatePlayerPoints } from '@/lib/fantasy'

export const dynamic = 'force-dynamic'

const db = supabaseAdmin || supabase

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameweek = parseInt(searchParams.get('gameweek') || '1')
    const userIdentifier = searchParams.get('user_identifier')

    // 1. Fetch all fantasy teams
    const { data: teams, error: teamsError } = await db
      .from('fantasy_teams')
      .select('id, user_identifier, team_name, manager_name, created_at')

    if (teamsError) throw teamsError

    if (!teams || teams.length === 0) {
      return NextResponse.json({
        gameweek,
        average_score: 0,
        highest_score: 0,
        total_managers: 0,
        user_stats: null,
        leaderboard: []
      })
    }

    // 2. Fetch all squad picks across all gameweeks
    const { data: allPicks, error: picksError } = await db
      .from('fantasy_squad_picks')
      .select(`
        id,
        fantasy_team_id,
        gameweek,
        player_id,
        position_slot,
        is_captain,
        players (
          id,
          name,
          position,
          goals,
          assists
        )
      `)

    if (picksError) throw picksError

    // 3. Fetch all fantasy player stats
    const { data: allStats, error: statsError } = await db
      .from('fantasy_player_stats')
      .select('*')

    if (statsError) throw statsError

    // Build stats lookup: `statsMap[`${gameweek}_${player_id}`]`
    const statsMap: Record<string, any> = {}
    ;(allStats || []).forEach((s: any) => {
      statsMap[`${s.gameweek}_${s.player_id}`] = s
    })

    // 4. Calculate points for every team
    const teamScoresMap: Record<string, { gwPoints: number; totalPoints: number }> = {}

    teams.forEach((t: any) => {
      teamScoresMap[t.id] = { gwPoints: 0, totalPoints: 0 }
    })

    ;(allPicks || []).forEach((pick: any) => {
      if (!teamScoresMap[pick.fantasy_team_id]) return

      const player = Array.isArray(pick.players) ? pick.players[0] : pick.players
      const statKey = `${pick.gameweek}_${pick.player_id}`
      const stat = statsMap[statKey]

      let pts = 0
      if (stat && stat.total_points !== undefined && stat.total_points !== null) {
        pts = Number(stat.total_points)
      } else {
        pts = calculatePlayerPoints(player?.position, stat || {
          goals: player?.goals || 0,
          assists: player?.assists || 0,
          clean_sheet: false,
          minutes_played: (player?.goals || player?.assists) ? 90 : 0,
          bonus_points: 0
        })
      }

      if (pick.is_captain) {
        pts *= 2
      }

      const isStarter = !pick.position_slot?.startsWith('SUB')

      if (isStarter) {
        // Add to overall total
        teamScoresMap[pick.fantasy_team_id].totalPoints += pts

        // If matches active gameweek, add to gwPoints
        if (Number(pick.gameweek) === Number(gameweek)) {
          teamScoresMap[pick.fantasy_team_id].gwPoints += pts
        }
      }
    })

    // 5. Build leaderboard array
    const leaderboard = teams.map((team: any) => {
      const scores = teamScoresMap[team.id] || { gwPoints: 0, totalPoints: 0 }
      return {
        team_id: team.id,
        user_identifier: team.user_identifier,
        team_name: team.team_name,
        manager_name: team.manager_name,
        gameweek_points: scores.gwPoints,
        total_points: scores.totalPoints
      }
    })

    // Sort by total_points DESC, then gameweek_points DESC
    leaderboard.sort((a, b) => {
      if (b.total_points !== a.total_points) {
        return b.total_points - a.total_points
      }
      return b.gameweek_points - a.gameweek_points
    })

    // Assign ranks
    leaderboard.forEach((entry, index) => {
      ;(entry as any).rank = index + 1
    })

    // Calculate metrics
    const totalManagers = leaderboard.length
    const totalGwScoreSum = leaderboard.reduce((acc, curr) => acc + curr.gameweek_points, 0)
    const averageScore = totalManagers > 0 ? Math.round(totalGwScoreSum / totalManagers) : 0
    const highestScore = totalManagers > 0 ? Math.max(...leaderboard.map(l => l.gameweek_points)) : 0

    let userStats = null
    if (userIdentifier) {
      const found = leaderboard.find(l => l.user_identifier === userIdentifier)
      if (found) {
        userStats = {
          rank: (found as any).rank,
          team_name: found.team_name,
          manager_name: found.manager_name,
          gameweek_points: found.gameweek_points,
          total_points: found.total_points
        }
      }
    }

    return NextResponse.json({
      gameweek,
      average_score: averageScore,
      highest_score: highestScore,
      total_managers: totalManagers,
      user_stats: userStats,
      leaderboard
    })
  } catch (error: any) {
    console.error('Error computing fantasy leaderboard:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
