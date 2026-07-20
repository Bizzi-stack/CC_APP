import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    // 1. Scan directory: public/Badge_Library
    const libraryPath = path.join(process.cwd(), 'public', 'Badge_Library')
    
    if (fs.existsSync(libraryPath)) {
      const files = fs.readdirSync(libraryPath)
      
      // Filter for image files
      const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif']
      const imageFiles = files.filter(file => 
        imageExtensions.includes(path.extname(file).toLowerCase())
      )

      if (imageFiles.length > 0) {
        // Fetch current badges in DB
        const { data: dbBadges } = await supabase
          .from('canvas_badges')
          .select('*')

        const existingUrls = new Set((dbBadges || []).map(b => b.image_url))

        // Find which files are not yet in Supabase
        const newBadgesToInsert = []
        for (const file of imageFiles) {
          const imageUrl = `/Badge_Library/${file}`
          if (!existingUrls.has(imageUrl)) {
            // Name: formatted basename without extension
            const baseName = path.parse(file).name
            const name = baseName
              .split(/[_-]+/)
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')

            newBadgesToInsert.push({
              name,
              image_url: imageUrl
            })
          }
        }

        // Insert new badges into Supabase
        if (newBadgesToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('canvas_badges')
            .insert(newBadgesToInsert)
          
          if (insertError) {
            console.error('Error inserting new auto-discovered badges:', insertError.message)
          }
        }
      }
    }
  } catch (err) {
    console.error('Error scanning badge library directory:', err)
  }

  // 2. Return all badges from DB
  const { data, error } = await supabase
    .from('canvas_badges')
    .select('*, owner:players(name)')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ badges: data })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, image_url } = body

    if (!name || !image_url) {
      return NextResponse.json({ error: 'Name and image URL are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('canvas_badges')
      .insert([{ name, image_url }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ badge: data }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }

  const { error } = await supabase.from('canvas_badges').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
