import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const franchiseToken = request.cookies.get('franchise_token')?.value

  if (!franchiseToken) {
    return NextResponse.json({ error: 'Not authenticated as a franchise owner' }, { status: 401 })
  }

  // Fetch franchise details
  const { data: franchise, error: franchiseError } = await supabase
    .from('franchises')
    .select('*')
    .eq('id', franchiseToken)
    .single()

  if (franchiseError || !franchise) {
    return NextResponse.json({ error: 'Franchise not found' }, { status: 404 })
  }

  // Fetch roster of signed players
  const { data: roster, error: rosterError } = await supabase
    .from('players')
    .select('*, franchises:franchises!players_franchise_id_fkey(*)')
    .eq('franchise_id', franchiseToken)
    .order('name', { ascending: true })

  if (rosterError) {
    return NextResponse.json({ error: rosterError.message }, { status: 500 })
  }

  return NextResponse.json({ franchise, roster })
}
