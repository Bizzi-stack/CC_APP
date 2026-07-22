import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  const playerId = request.cookies.get('player_token')?.value

  if (!playerId) {
    return NextResponse.json({ error: 'Not authenticated as a player' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { banner_url, instagram_url, spotify_track_url, is_business, business_name } = body

    // Format Instagram URL if provided as handle
    let formattedIg = instagram_url ? instagram_url.trim() : null
    if (formattedIg) {
      if (!formattedIg.startsWith('http://') && !formattedIg.startsWith('https://')) {
        formattedIg = `https://instagram.com/${formattedIg.replace(/^@/, '')}`
      }
    }

    const { error } = await supabase
      .from('players')
      .update({
        banner_url: banner_url !== undefined ? banner_url : null,
        instagram_url: formattedIg,
        spotify_track_url: spotify_track_url !== undefined ? spotify_track_url : null,
        is_business: Boolean(is_business),
        business_name: business_name ? business_name.trim() : null,
      })
      .eq('id', playerId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Invalid request' }, { status: 400 })
  }
}
