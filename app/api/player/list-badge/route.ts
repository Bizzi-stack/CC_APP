import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const playerId = request.cookies.get('player_token')?.value

  if (!playerId) {
    return NextResponse.json({ error: 'Not authenticated as a player' }, { status: 401 })
  }

  try {
    const { badgeId, action, price } = await request.json()

    if (!badgeId || !action || !['list', 'unlist'].includes(action)) {
      return NextResponse.json({ error: 'Badge ID and action (list/unlist) are required' }, { status: 400 })
    }

    // Verify badge exists and belongs to the active player
    const { data: badge, error: badgeError } = await supabase
      .from('canvas_badges')
      .select('*')
      .eq('id', badgeId)
      .single()

    if (badgeError || !badge) {
      return NextResponse.json({ error: 'Badge not found' }, { status: 404 })
    }

    if (badge.owner_id !== playerId) {
      return NextResponse.json({ error: 'You do not own this badge' }, { status: 403 })
    }

    let updatedFields: any = {}

    if (action === 'list') {
      if (price === undefined || isNaN(price) || price <= 0) {
        return NextResponse.json({ error: 'A valid positive listing price is required' }, { status: 400 })
      }
      updatedFields = {
        is_listed: true,
        price: Math.floor(price)
      }
    } else {
      updatedFields = {
        is_listed: false
      }
    }

    const { error: updateError } = await supabase
      .from('canvas_badges')
      .update(updatedFields)
      .eq('id', badgeId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Invalid request' }, { status: 400 })
  }
}
