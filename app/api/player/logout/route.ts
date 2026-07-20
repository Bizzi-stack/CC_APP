import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  
  // Clear cookie: player_token
  response.cookies.set('player_token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/'
  })

  return response
}
