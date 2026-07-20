import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const isAdmin = request.cookies.has('admin_token')
  return NextResponse.json({ isAdmin })
}
