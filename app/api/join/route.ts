import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Public endpoint — players submit themselves, always status = 'pending'
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, position, photo_url, notes } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('players')
      .insert([{
        name,
        position: position || null,
        photo_url: photo_url || null,
        notes: notes || null,
        available: true,
        value: 0,
        status: 'pending', // always pending — admin approves and sets value
      }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ player: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
