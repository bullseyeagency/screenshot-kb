import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { analyzeImage } from '@/lib/claude'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { screenshotId } = body as { screenshotId: string }

    if (!screenshotId) {
      return NextResponse.json({ error: 'screenshotId is required' }, { status: 400 })
    }

    // Fetch the screenshot record (includes R2 public URL)
    const { data: screenshot, error: fetchError } = await supabase
      .from('screenshots')
      .select('*')
      .eq('id', screenshotId)
      .single()

    if (fetchError || !screenshot) {
      return NextResponse.json({ error: 'Screenshot not found' }, { status: 404 })
    }

    // Mark as processing
    await supabase
      .from('screenshots')
      .update({ status: 'processing' })
      .eq('id', screenshotId)

    // Fetch the image from R2 public URL
    const res = await fetch(screenshot.url)
    if (!res.ok) {
      await supabase.from('screenshots').update({ status: 'analyzed' }).eq('id', screenshotId)
      return NextResponse.json({ error: `Failed to fetch image from R2: ${res.status}` }, { status: 500 })
    }

    const arrayBuffer = await res.arrayBuffer()
    const imageBuffer = Buffer.from(arrayBuffer)

    // Send to Claude Vision via shared lib
    const analysisResult = await analyzeImage(imageBuffer)

    const updatePayload = {
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
    }

    const { data: updated, error: updateError } = await supabase
      .from('screenshots')
      .update(updatePayload)
      .eq('id', screenshotId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: `DB update failed: ${updateError.message}` }, { status: 500 })
    }

    return NextResponse.json({ screenshot: updated })
  } catch (error: unknown) {
    console.error('Analyze error:', error)
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
