import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const db = supabaseAdmin || supabase

export async function GET() {
  try {
    const { data: players, error } = await db
      .from('players')
      .select('id, name, position, photo_url, country, franchise_id, badges, goals, assists')
      .order('name', { ascending: true })

    if (error) throw error

    const otwPlayers = (players || []).filter(p => Array.isArray(p.badges) && p.badges.includes('OTW'))

    return NextResponse.json({
      all_players: players || [],
      otw_players: otwPlayers
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { player_id, is_otw } = await request.json()

    if (!player_id) {
      return NextResponse.json({ error: 'player_id is required' }, { status: 400 })
    }

    // 1. Fetch current player badges
    const { data: player, error: fetchError } = await db
      .from('players')
      .select('id, badges')
      .eq('id', player_id)
      .single()

    if (fetchError || !player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    const currentBadges: string[] = Array.isArray(player.badges) ? [...player.badges] : []
    let updatedBadges: string[]

    if (is_otw) {
      if (!currentBadges.includes('OTW')) {
        currentBadges.push('OTW')
      }
      updatedBadges = currentBadges
    } else {
      updatedBadges = currentBadges.filter(b => b !== 'OTW')
    }

    // 2. Save updated badges in Supabase
    const { error: updateError } = await db
      .from('players')
      .update({ badges: updatedBadges })
      .eq('id', player_id)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      player_id,
      is_otw: Boolean(is_otw),
      badges: updatedBadges
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
