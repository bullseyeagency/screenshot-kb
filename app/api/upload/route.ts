import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { compressImage } from '@/lib/compress'
import { uploadToR2 } from '@/lib/r2'
import { analyzeImage } from '@/lib/claude'

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

      // 1. Read file as Buffer
      const arrayBuffer = await file.arrayBuffer()
      const rawBuffer = Buffer.from(arrayBuffer)

      // 2. Compress image to JPEG
      const compressed = await compressImage(rawBuffer)

      // 3. Generate R2 key
      const key = `screenshots/${crypto.randomUUID()}-${Date.now()}.jpg`

      // 4. Upload compressed buffer to R2
      const publicUrl = await uploadToR2(key, compressed.buffer, 'image/jpeg')

      // 5. Insert DB record with status: 'processing'
      const { data: record, error: insertError } = await supabase
        .from('screenshots')
        .insert({
          filename: file.name,
          storage_path: key,
          url: publicUrl,
          file_size: compressed.sizeBytes,
          mime_type: 'image/jpeg',
          status: 'processing',
        })
        .select()
        .single()

      if (insertError) {
        console.error('DB insert error:', insertError)
        return NextResponse.json({ error: `DB insert failed: ${insertError.message}` }, { status: 500 })
      }

      // 6. Call Claude Vision with compressed buffer
      let analysisResult
      try {
        analysisResult = await analyzeImage(compressed.buffer)
      } catch (claudeError) {
        console.error('Claude analysis error:', claudeError)
        // Return the processing record — client can poll or retry
        created.push(record)
        continue
      }

      // 7. Update DB record with analysis + status: 'analyzed'
      const { data: updated, error: updateError } = await supabase
        .from('screenshots')
        .update({
          status: 'analyzed',
          ocr: analysisResult.ocr || null,
          analysis: analysisResult.analysis || null,
          summary: analysisResult.summary || null,
          categories: analysisResult.categories,
          tags: analysisResult.tags,
          topics: analysisResult.topics,
          content_type: analysisResult.content_type || null,
          key_entities: analysisResult.key_entities,
          action_items: analysisResult.action_items,
          source_hint: analysisResult.source_hint || null,
        })
        .eq('id', record.id)
        .select()
        .single()

      if (updateError) {
        console.error('DB update error:', updateError)
        created.push(record)
        continue
      }

      // 8. Return fully analyzed screenshot record
      created.push(updated)
    }

    return NextResponse.json({ screenshots: created })
  } catch (error: unknown) {
    console.error('Upload error:', error)
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
