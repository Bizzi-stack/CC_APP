import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const available = searchParams.get('available')
  const status = searchParams.get('status') // 'active', 'pending', or null (all)

  let query = supabase
    .from('players')
    .select('*, franchises:franchises!players_franchise_id_fkey(*)')
    .order('name', { ascending: true })

  // Filter by status
  if (status === 'active') {
    query = query.eq('status', 'active')
  } else if (status === 'pending') {
    query = query.eq('status', 'pending')
  }

  if (available === 'true') {
    query = query.eq('available', true)
  } else if (available === 'false') {
    query = query.eq('available', false)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Enrich with owned_franchise data for franchise owners
  const enriched = await Promise.all((data || []).map(async (player) => {
    if (player.owned_franchise_id) {
      const { data: ownedFranchise } = await supabase
        .from('franchises')
        .select('id, name, logo_url')
        .eq('id', player.owned_franchise_id)
        .single()
      return { ...player, owned_franchise: ownedFranchise || null }
    }
    return { ...player, owned_franchise: null }
  }))

  return NextResponse.json({ players: enriched })
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
        status: status || 'active',
        franchise_id: body.franchise_id || null,
        badges: badges || [],
        canvas_badge_ids: canvas_badge_ids || [],
        canvas_badges_data: canvas_badges_data || [],
        verification_badge: verification_badge || 'none',
      }])
      .select('*, franchises:franchises!players_franchise_id_fkey(*)')
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
      .select('*, franchises:franchises!players_franchise_id_fkey(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Enrich with owned_franchise
    if (data?.owned_franchise_id) {
      const { data: ownedFranchise } = await supabase
        .from('franchises')
        .select('id, name, logo_url')
        .eq('id', data.owned_franchise_id)
        .single()
      return NextResponse.json({ player: { ...data, owned_franchise: ownedFranchise || null } })
    }

    return NextResponse.json({ player: { ...data, owned_franchise: null } })
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
