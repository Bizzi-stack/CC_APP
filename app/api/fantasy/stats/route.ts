import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { calculatePlayerPoints } from '@/lib/fantasy'

export const dynamic = 'force-dynamic'

const db = supabaseAdmin || supabase

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameweek = parseInt(searchParams.get('gameweek') || '1')

    // 1. Fetch gameweeks
    const { data: gameweeks } = await db
      .from('fantasy_gameweeks')
      .select('*')
      .order('id', { ascending: true })

    // 2. Fetch all registered players
    const { data: players, error: playersError } = await db
      .from('players')
      .select(`
        id,
        name,
        position,
        photo_url,
        country,
        goals,
        assists,
        franchise_id,
        franchises:franchises!players_franchise_id_fkey (
          id,
          name,
          logo_url
        )
      `)
      .order('name', { ascending: true })

    if (playersError) throw playersError

    // 3. Fetch fantasy stats for this gameweek
    const { data: statsData } = await db
      .from('fantasy_player_stats')
      .select('*')
      .eq('gameweek', gameweek)

    const statsMap: Record<string, any> = {}
    ;(statsData || []).forEach((s: any) => {
      statsMap[s.player_id] = s
    })

    const enrichedPlayers = (players || []).map((p: any) => {
      const stat = statsMap[p.id] || {
        goals: p.goals || 0,
        assists: p.assists || 0,
        clean_sheet: false,
        minutes_played: (p.goals || p.assists) ? 90 : 0,
        bonus_points: 0
      }

      const points = calculatePlayerPoints(p.position, stat)

      return {
        ...p,
        stats: stat,
        fantasy_points: points
      }
    })

    return NextResponse.json({
      gameweek,
      gameweeks: gameweeks || [
        { id: 1, name: 'Gameweek 1 - Group Stage', status: 'active' },
        { id: 2, name: 'Gameweek 2 - Group Stage', status: 'upcoming' },
        { id: 3, name: 'Gameweek 3 - Finals', status: 'upcoming' }
      ],
      players: enrichedPlayers
    })
  } catch (error: any) {
    console.error('Error fetching fantasy player stats:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gameweek, player_id, goals, assists, clean_sheet, minutes_played, bonus_points, yellow_cards, red_cards } = body

    if (!gameweek || !player_id) {
      return NextResponse.json({ error: 'Missing gameweek or player_id' }, { status: 400 })
    }

    const { data: player } = await db
      .from('players')
      .select('position')
      .eq('id', player_id)
      .single()

    const calculatedPts = calculatePlayerPoints(player?.position, {
      goals,
      assists,
      clean_sheet,
      minutes_played,
      bonus_points,
      yellow_cards,
      red_cards
    })

    const { data, error } = await db
      .from('fantasy_player_stats')
      .upsert({
        gameweek,
        player_id,
        goals: goals || 0,
        assists: assists || 0,
        clean_sheet: Boolean(clean_sheet),
        minutes_played: minutes_played || 0,
        bonus_points: bonus_points || 0,
        yellow_cards: yellow_cards || 0,
        red_cards: red_cards || 0,
        total_points: calculatedPts,
        updated_at: new Date().toISOString()
      }, { onConflict: 'gameweek,player_id' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, stat: data })
  } catch (error: any) {
    console.error('Error updating fantasy player stats:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
