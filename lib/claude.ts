import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are an expert at analyzing screenshots and images. You extract all visible text (OCR), identify what the image shows, and enrich it with structured metadata. Always respond with valid JSON only — no markdown, no code blocks, no extra text. All string values must use only straight single quotes or avoid quotes entirely — never use escaped double quotes inside JSON strings.`

const USER_PROMPT = `Analyze this screenshot thoroughly. Return a JSON object with exactly these fields:
- "ocr": all visible text extracted from the image as a single string, empty string if none
- "analysis": detailed analysis of what this screenshot shows — interface type, content, context, notable elements, visual design choices — plain text, no markdown, at least 3 sentences
- "summary": 2-3 sentence summary of what this is and why it matters — plain text, no markdown
- "categories": array of 1-4 broad category strings (e.g. "Design", "Development", "Marketing", "Finance", "Communication", "Productivity")
- "tags": array of 3-8 specific keyword strings (e.g. "dark-mode", "pricing-table", "react", "dashboard")
- "topics": array of 2-5 topic strings describing the subject matter (e.g. "SaaS pricing", "UI patterns", "team collaboration")
- "content_type": single string classification (e.g. "UI Screenshot", "Code Editor", "Document", "Social Media", "Email", "Dashboard", "Chart", "Photo", "Diagram")
- "key_entities": array of 2-8 named entities found — companies, tools, people, products, technologies (e.g. "Stripe", "React", "Figma")
- "action_items": array of 0-4 actionable strings a developer or designer might take based on seeing this (e.g. "Implement this pricing layout", "Review the nav structure")
- "source_hint": single string guessing where this screenshot likely came from (e.g. "Stripe dashboard", "GitHub", "Figma", "Unknown")

Return only the JSON object, nothing else.`

export interface AnalysisResult {
  ocr: string
  analysis: string
  summary: string
  categories: string[]
  tags: string[]
  topics: string[]
  content_type: string
  key_entities: string[]
  action_items: string[]
  source_hint: string
}

/**
 * Analyze an image buffer with Claude Vision.
 * Returns structured metadata extracted from the image.
 */
export async function analyzeImage(imageBuffer: Buffer): Promise<AnalysisResult> {
  const base64 = imageBuffer.toString('base64')

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: base64,
            },
          },
          {
            type: 'text',
            text: USER_PROMPT,
          },
        ],
      },
    ],
  })

  const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

  // Normalize arrays — Claude may return strings for single-item arrays
  const toArray = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.filter((x) => typeof x === 'string')
    if (typeof v === 'string' && v.length > 0) return [v]
    return []
  }

  try {
    const cleaned = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
    const parsed = JSON.parse(cleaned)
    return {
      ocr: typeof parsed.ocr === 'string' ? parsed.ocr : '',
      analysis: typeof parsed.analysis === 'string' ? parsed.analysis : '',
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      categories: toArray(parsed.categories),
      tags: toArray(parsed.tags),
      topics: toArray(parsed.topics),
      content_type: typeof parsed.content_type === 'string' ? parsed.content_type : '',
      key_entities: toArray(parsed.key_entities),
      action_items: toArray(parsed.action_items),
      source_hint: typeof parsed.source_hint === 'string' ? parsed.source_hint : '',
    }
  } catch {
    return {
      ocr: '',
      analysis: responseText,
      summary: responseText.slice(0, 300),
      categories: [],
      tags: [],
      topics: [],
      content_type: '',
      key_entities: [],
      action_items: [],
      source_hint: '',
    }
  }
}
