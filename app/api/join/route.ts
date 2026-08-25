import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Public endpoint — players submit themselves, always status = 'pending'
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, position, photo_url, notes, country, playstyle, badges, passcode, franchise_id } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const initialBadges: string[] = []
    if (Array.isArray(badges)) {
      initialBadges.push(...badges)
    } else if (playstyle) {
      initialBadges.push(playstyle)
    }

    const { data, error } = await supabase
      .from('players')
      .insert([{
        name,
        position: position || null,
        photo_url: photo_url || null,
        franchise_id: franchise_id || null,
        notes: notes || null,
        country: country || 'Barbados',
        passcode: passcode ? passcode.toString().trim() : '1234',
        badges: initialBadges.length > 0 ? initialBadges : null,
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
