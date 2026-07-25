import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const playerId = searchParams.get('player_id')

  if (!playerId) {
    return NextResponse.json({ error: 'Missing player_id' }, { status: 400 })
  }

  try {
    const { data: history, error } = await supabase
      .from('player_value_history')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ history })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
