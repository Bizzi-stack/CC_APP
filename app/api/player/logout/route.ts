import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  
  response.cookies.delete('player_token')
  // We keep community_token or delete if desired. Deleting player_token logs out player account.

  return response
}
