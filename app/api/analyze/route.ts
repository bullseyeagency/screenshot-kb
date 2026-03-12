import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('image') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported image type. Please upload a JPG, PNG, GIF, or WebP.' },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system:
        'You are an expert at analyzing images. Extract all visible text (OCR), provide a concise analysis of the content and context, then write a 2-3 sentence summary. Always respond with valid JSON only — no markdown, no code blocks, no extra text.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: 'Analyze this image. Return a JSON object with exactly three fields: "ocr" (all extracted text as a single string, empty string if none), "analysis" (what this image shows, context, key observations — plain text, no markdown), "summary" (2-3 sentence summary of the topic/content — plain text, no markdown). Return only the JSON object, nothing else.',
            },
          ],
        },
      ],
    })

    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    let parsed: { ocr: string; analysis: string; summary: string }

    try {
      // Strip any accidental markdown code fences if present
      const cleaned = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim()
      parsed = JSON.parse(cleaned)
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse Claude response as JSON', raw: responseText },
        { status: 500 }
      )
    }

    if (
      typeof parsed.ocr !== 'string' ||
      typeof parsed.analysis !== 'string' ||
      typeof parsed.summary !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Unexpected response shape from Claude', raw: responseText },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ocr: parsed.ocr,
      analysis: parsed.analysis,
      summary: parsed.summary,
    })
  } catch (error: unknown) {
    console.error('Analyze error:', error)
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
