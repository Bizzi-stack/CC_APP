import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL || 'https://script.google.com/macros/s/AKfycbwcXkGuqH3nBspbAw_7Y8qVHa4A0hAHx2dmoEj033KRwMF4W0uQYYQ7w7JauDJsODWmeg/exec'
  if (!webhookUrl) {
    return NextResponse.json({ error: 'GOOGLE_SHEETS_WEBHOOK_URL is not configured' }, { status: 500 })
  }

  try {
    // 1. Fetch all players with franchise name
    const { data: players, error } = await supabase
      .from('players')
      .select('*, franchises:franchises!players_franchise_id_fkey(name)')
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!players || players.length === 0) {
      return NextResponse.json({ message: 'No players found to sync', count: 0 })
    }

    let successCount = 0
    let failCount = 0

    // 2. Push each player with complete fields
    for (const player of players) {
      const franchiseName = player.franchises?.name || null
      const playerCountry = player.country || 'Barbados'
      const tournamentCountry = franchiseName || playerCountry

      const payload = {
        id: player.id,
        name: player.name || '',
        email: player.email || 'N/A',
        phone: player.phone || 'N/A',
        is_uwi_student: player.is_uwi_student ? 'Yes' : 'No',
        student_id: player.is_uwi_student ? (player.student_id || 'N/A') : 'N/A',
        sport: player.sport || 'Football',
        team: tournamentCountry,
        franchise_name: tournamentCountry,
        tournament_team: tournamentCountry,
        tournament_country: tournamentCountry,
        country: playerCountry,
        nationality: playerCountry,
        position: player.position || 'N/A',
        submitted_at: player.created_at || new Date().toISOString(),
        timestamp: player.created_at || new Date().toISOString(),
        created_at: player.created_at || new Date().toISOString()
      }

      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (res.ok) {
          successCount++
        } else {
          failCount++
        }
      } catch {
        failCount++
      }
    }

    return NextResponse.json({
      success: true,
      total_players: players.length,
      synced: successCount,
      failed: failCount
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Sync failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
