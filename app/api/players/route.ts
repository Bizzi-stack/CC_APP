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

  const playersList = data || []
  
  // Extract unique owned franchise IDs for bulk lookup (Eliminating N+1 query problem)
  const ownedFranchiseIds = Array.from(new Set(playersList.map(p => p.owned_franchise_id).filter(Boolean)))
  
  let ownedFranchisesMap: Record<string, { id: string, name: string, logo_url: string | null }> = {}
  if (ownedFranchiseIds.length > 0) {
    const { data: franchisesData } = await supabase
      .from('franchises')
      .select('id, name, logo_url')
      .in('id', ownedFranchiseIds)
    
    if (franchisesData) {
      franchisesData.forEach(f => {
        ownedFranchisesMap[f.id] = f
      })
    }
  }

  // Calculate max goals and max assists for Top Scorer & Top Assister badges
  const maxGoals = Math.max(...playersList.map(p => p.goals || 0), 0)
  const maxAssists = Math.max(...playersList.map(p => p.assists || 0), 0)

  const enriched = playersList.map(player => ({
    ...player,
    owned_franchise: player.owned_franchise_id ? (ownedFranchisesMap[player.owned_franchise_id] || null) : null,
    is_top_scorer: Boolean(maxGoals > 0 && player.goals === maxGoals),
    is_top_assister: Boolean(maxAssists > 0 && player.assists === maxAssists)
  }))

  return NextResponse.json({ players: enriched })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, position, photo_url, available, notes, value, status, badges, canvas_badge_ids, canvas_badges_data, verification_badge, franchise_id } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    // A player assigned to a franchise is signed and unavailable for free-agency
    const isAssigned = Boolean(franchise_id || body.owned_franchise_id || body.is_franchise_owner)
    const finalAvailable = isAssigned ? false : (available !== undefined ? available : true)

    const { data, error } = await supabase
      .from('players')
      .insert([{
        name,
        position: position || null,
        photo_url: photo_url || null,
        available: finalAvailable,
        notes: notes || null,
        value: value || 0,
        status: status || 'active',
        franchise_id: franchise_id || null,
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

    // If player has a franchise assigned, force available to false (they are signed to a team)
    if (body.franchise_id || body.is_franchise_owner || body.owned_franchise_id) {
      body.available = false
      if (body.is_franchise_owner && body.owned_franchise_id) {
        body.franchise_id = body.owned_franchise_id
      }
    } else if (body.franchise_id === null || body.franchise_id === '') {
      // If franchise is unassigned, make available true unless explicitly set
      if (body.available === undefined) {
        body.available = true
      }
    }

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
