import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  let query = supabase
    .from('sessions')
    .select('*, signups:session_signups(*, player:players(*))')
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ sessions: data })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, type, date, time, location, notes, max_players, image_url, has_team_selection, team_a_name, team_b_name } = body

    if (!title || !type || !date || !time || !location) {
      return NextResponse.json({ error: 'title, type, date, time, and location are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('sessions')
      .insert([{
        title,
        type,
        date,
        time,
        location,
        notes: notes || null,
        max_players: max_players || 999,
        image_url: image_url || null,
        has_team_selection: has_team_selection !== undefined ? has_team_selection : true,
        team_a_name: team_a_name || 'Red Team',
        team_b_name: team_b_name || 'Blue Team',
      }])
      .select('*, signups:session_signups(*, player:players(*))')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ session: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const { error } = await supabase.from('sessions').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
