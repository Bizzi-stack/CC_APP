import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const db = supabaseAdmin || supabase

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 365 // 1 Year Persistent Login
}

// GET: Retrieve current logged-in manager
export async function GET(request: NextRequest) {
  try {
    const managerId = request.cookies.get('manager_token')?.value
    if (!managerId) {
      return NextResponse.json({ manager: null })
    }

    // 1. Try fantasy_managers table
    try {
      const { data: fm, error: fmErr } = await db
        .from('fantasy_managers')
        .select('id, name, username')
        .eq('id', managerId)
        .single()

      if (!fmErr && fm) {
        return NextResponse.json({ manager: fm })
      }
    } catch {
      // Ignore if table does not exist
    }

    // 2. Fallback to players table with status = 'fan'
    const { data: playerFan, error: pfErr } = await db
      .from('players')
      .select('id, name, notes, email')
      .eq('id', managerId)
      .eq('status', 'fan')
      .single()

    if (!pfErr && playerFan) {
      const username = playerFan.notes || playerFan.email?.split('@')[0] || playerFan.name
      return NextResponse.json({
        manager: {
          id: playerFan.id,
          name: playerFan.name,
          username
        }
      })
    }

    return NextResponse.json({ manager: null })
  } catch (error: any) {
    console.error('Error fetching manager session:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

// POST: Register or Log In
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action = 'login', name, username, passcode } = body

    const cleanUsername = (username || '').trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '')
    const cleanPasscode = (passcode || '').trim()

    if (!cleanUsername || !cleanPasscode) {
      return NextResponse.json({ error: 'Username and passcode are required.' }, { status: 400 })
    }

    let hasDedicatedTable = false
    try {
      const testRes = await db.from('fantasy_managers').select('id').limit(1)
      if (!testRes.error || testRes.status !== 404) {
        hasDedicatedTable = true
      }
    } catch {
      hasDedicatedTable = false
    }

    if (action === 'register') {
      const cleanName = (name || '').trim()
      if (!cleanName) {
        return NextResponse.json({ error: 'Please provide your name.' }, { status: 400 })
      }

      // Check if username is already taken
      if (hasDedicatedTable) {
        const { data: existing } = await db
          .from('fantasy_managers')
          .select('id')
          .ilike('username', cleanUsername)

        if (existing && existing.length > 0) {
          return NextResponse.json({ error: 'Username already taken. Please choose another or log in.' }, { status: 400 })
        }

        const { data: newManager, error: insertError } = await db
          .from('fantasy_managers')
          .insert([{
            name: cleanName,
            username: cleanUsername,
            passcode: cleanPasscode
          }])
          .select()
          .single()

        if (insertError) throw insertError

        const response = NextResponse.json({
          success: true,
          manager: {
            id: newManager.id,
            name: newManager.name,
            username: newManager.username
          }
        })

        response.cookies.set({ name: 'manager_token', value: newManager.id, ...COOKIE_OPTIONS })
        response.cookies.set({ name: 'community_token', value: 'authenticated', ...COOKIE_OPTIONS })
        return response
      } else {
        // Fallback: Store in players table with status = 'fan'
        const fakeEmail = `${cleanUsername}@fpl.uwi.edu`
        const { data: existing } = await db
          .from('players')
          .select('id')
          .or(`notes.eq.${cleanUsername},email.ilike.${cleanUsername}@%`)

        if (existing && existing.length > 0) {
          return NextResponse.json({ error: 'Username already taken. Please choose another or log in.' }, { status: 400 })
        }

        const { data: newFan, error: insertError } = await db
          .from('players')
          .insert([{
            name: cleanName,
            email: fakeEmail,
            notes: cleanUsername,
            passcode: cleanPasscode,
            status: 'fan',
            position: 'FAN',
            sport: 'Fantasy',
            available: false
          }])
          .select()
          .single()

        if (insertError) throw insertError

        const response = NextResponse.json({
          success: true,
          manager: {
            id: newFan.id,
            name: newFan.name,
            username: cleanUsername
          }
        })

        response.cookies.set({ name: 'manager_token', value: newFan.id, ...COOKIE_OPTIONS })
        response.cookies.set({ name: 'community_token', value: 'authenticated', ...COOKIE_OPTIONS })
        return response
      }
    } else {
      // Action === 'login'
      if (hasDedicatedTable) {
        const { data: managers, error: mgrErr } = await db
          .from('fantasy_managers')
          .select('*')
          .ilike('username', cleanUsername)

        if (mgrErr || !managers || managers.length === 0) {
          return NextResponse.json({ error: 'Fantasy Manager account not found. Check username or create account.' }, { status: 404 })
        }

        const mgr = managers[0]
        if (mgr.passcode !== cleanPasscode) {
          return NextResponse.json({ error: 'Incorrect passcode.' }, { status: 401 })
        }

        const response = NextResponse.json({
          success: true,
          manager: {
            id: mgr.id,
            name: mgr.name,
            username: mgr.username
          }
        })

        response.cookies.set({ name: 'manager_token', value: mgr.id, ...COOKIE_OPTIONS })
        response.cookies.set({ name: 'community_token', value: 'authenticated', ...COOKIE_OPTIONS })
        return response
      } else {
        // Fallback: search in players table where status = 'fan'
        const { data: fans, error: fanErr } = await db
          .from('players')
          .select('*')
          .eq('status', 'fan')

        const matchedFan = (fans || []).find((f: any) => 
          (f.notes && f.notes.toLowerCase() === cleanUsername) ||
          (f.email && f.email.toLowerCase().startsWith(cleanUsername + '@')) ||
          (f.name && f.name.toLowerCase() === cleanUsername)
        )

        if (fanErr || !matchedFan) {
          return NextResponse.json({ error: 'Fantasy Manager account not found. Check username or create account.' }, { status: 404 })
        }

        if (matchedFan.passcode !== cleanPasscode) {
          return NextResponse.json({ error: 'Incorrect passcode.' }, { status: 401 })
        }

        const response = NextResponse.json({
          success: true,
          manager: {
            id: matchedFan.id,
            name: matchedFan.name,
            username: matchedFan.notes || cleanUsername
          }
        })

        response.cookies.set({ name: 'manager_token', value: matchedFan.id, ...COOKIE_OPTIONS })
        response.cookies.set({ name: 'community_token', value: 'authenticated', ...COOKIE_OPTIONS })
        return response
      }
    }
  } catch (err: any) {
    console.error('Fantasy auth error:', err)
    return NextResponse.json({ error: err.message || 'Authentication error' }, { status: 500 })
  }
}
