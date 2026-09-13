import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  
  const cookieOptions = {
    path: '/',
    maxAge: 0
  }

  response.cookies.set({ name: 'manager_token', value: '', ...cookieOptions })
  response.cookies.set({ name: 'community_token', value: '', ...cookieOptions })

  return response
}
