import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert File to Buffer / Base64 Data URL for guaranteed fallback
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Data = `data:${file.type || 'image/png'};base64,${buffer.toString('base64')}`

    const bucketName = process.env.NEXT_PUBLIC_SUPABASE_BUCKET

    if (bucketName) {
      try {
        const fileExt = file.name.split('.').pop() || 'png'
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`
        const filePath = `posters/${fileName}`

        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, buffer, {
            contentType: file.type || 'image/png',
            upsert: true
          })

        if (!error && data) {
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath)

          if (urlData?.publicUrl) {
            return NextResponse.json({
              success: true,
              url: urlData.publicUrl,
              path: filePath
            })
          }
        }
      } catch (e) {
        console.error('Storage bucket upload error, falling back to base64 data url:', e)
      }
    }

    // Return data URL as fallback so file upload from computer ALWAYS succeeds
    return NextResponse.json({
      success: true,
      url: base64Data
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal upload error' },
      { status: 500 }
    )
  }
}
