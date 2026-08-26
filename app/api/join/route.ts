import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Helper function to non-blockingly auto-push registration data to external Google Sheet
async function syncToGoogleSheet(playerData: Record<string, any>) {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL
  if (!webhookUrl) return

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playerData)
    })
  } catch (err) {
    console.error('Google Sheets auto-sync notice:', err)
  }
}

// Public endpoint — players submit themselves, always status = 'pending'
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      name, 
      email, 
      phone, 
      is_uwi_student, 
      student_id, 
      position, 
      photo_url, 
      notes, 
      country, 
      playstyle, 
      badges, 
      passcode, 
      franchise_id 
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const initialBadges: string[] = []
    if (Array.isArray(badges)) {
      initialBadges.push(...badges)
    } else if (playstyle) {
      initialBadges.push(playstyle)
    }

    // Lookup franchise team name if available
    let teamName = 'Free Agent'
    if (franchise_id) {
      const { data: f } = await supabase.from('franchises').select('name').eq('id', franchise_id).single()
      if (f?.name) teamName = f.name
    }

    const isUwi = is_uwi_student !== undefined ? Boolean(is_uwi_student) : true

    const { data, error } = await supabase
      .from('players')
      .insert([{
        name,
        email: email || null,
        phone: phone || null,
        is_uwi_student: isUwi,
        student_id: isUwi ? (student_id || null) : null,
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

    // Auto-sync to external Google Sheet (if GOOGLE_SHEETS_WEBHOOK_URL is set)
    syncToGoogleSheet({
      id: data.id,
      name: name,
      email: email || 'N/A',
      phone: phone || 'N/A',
      is_uwi_student: isUwi ? 'Yes' : 'No',
      student_id: isUwi ? (student_id || 'N/A') : 'N/A',
      country: country || 'Barbados',
      position: position || 'N/A',
      team: teamName,
      submitted_at: new Date().toISOString()
    }).catch(() => {})

    return NextResponse.json({ player: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
