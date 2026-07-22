import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const available = searchParams.get('available')
  const status = searchParams.get('status') // 'active', 'pending', or null (all)

  let { data, error } = await supabase
    .from('players')
    .select('*, franchises(*), owned_franchise:franchises!players_owned_franchise_id_fkey(id, name, logo_url)')
    .order('name', { ascending: true })

  // Fallback if relation cache is updating
  if (error) {
    let fallbackQuery = supabase
      .from('players')
      .select('*, franchises(*)')
      .order('name', { ascending: true })

    if (status === 'active') {
      fallbackQuery = fallbackQuery.eq('status', 'active')
    } else if (status === 'pending') {
      fallbackQuery = fallbackQuery.eq('status', 'pending')
    }

    if (available === 'true') {
      fallbackQuery = fallbackQuery.eq('available', true)
    } else if (available === 'false') {
      fallbackQuery = fallbackQuery.eq('available', false)
    }

    const fallbackRes = await fallbackQuery
    data = fallbackRes.data
    error = fallbackRes.error
  } else {
    // Apply filters to data if query succeeded
    if (status === 'active') {
      data = (data || []).filter(p => p.status === 'active')
    } else if (status === 'pending') {
      data = (data || []).filter(p => p.status === 'pending')
    }

    if (available === 'true') {
      data = (data || []).filter(p => p.available === true)
    } else if (available === 'false') {
      data = (data || []).filter(p => p.available === false)
    }
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ players: data })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, position, photo_url, available, notes, value, status, badges, canvas_badge_ids, canvas_badges_data, verification_badge } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('players')
      .insert([{
        name,
        position: position || null,
        photo_url: photo_url || null,
        available: available !== undefined ? available : true,
        notes: notes || null,
        value: value || 0,
        status: status || 'active', // Admin-added players are active by default
        franchise_id: body.franchise_id || null,
        badges: badges || [],
        canvas_badge_ids: canvas_badge_ids || [],
        canvas_badges_data: canvas_badges_data || [],
        verification_badge: verification_badge || 'none',
      }])
      .select('*, franchises(*), owned_franchise:franchises!owned_franchise_id(id, name, logo_url)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ player: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { data, error } = await supabase
      .from('players')
      .update(body)
      .eq('id', id)
      .select('*, franchises(*), owned_franchise:franchises!owned_franchise_id(id, name, logo_url)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ player: data })
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

  const { error } = await supabase.from('players').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
