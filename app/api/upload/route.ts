import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('images') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif']
    const created = []

    for (const file of files) {
      if (!file.type.startsWith('image/') && !allowedTypes.includes(file.type)) {
        continue
      }

      const id = crypto.randomUUID()
      const storagePath = `screenshots/${id}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('screenshots')
        .upload(storagePath, buffer, {
          contentType: file.type || 'image/jpeg',
          upsert: false,
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('screenshots').getPublicUrl(storagePath)
      const publicUrl = urlData.publicUrl

      // Insert DB record
      const { data: record, error: insertError } = await supabase
        .from('screenshots')
        .insert({
          id,
          filename: file.name,
          storage_path: storagePath,
          url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          status: 'inbox',
        })
        .select()
        .single()

      if (insertError) {
        console.error('DB insert error:', insertError)
        return NextResponse.json({ error: `DB insert failed: ${insertError.message}` }, { status: 500 })
      }

      created.push(record)
    }

    return NextResponse.json({ screenshots: created })
  } catch (error: unknown) {
    console.error('Upload error:', error)
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
