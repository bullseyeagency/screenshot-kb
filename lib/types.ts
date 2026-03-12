export interface Screenshot {
  id: string
  filename: string
  storage_path: string
  url: string
  file_size: number | null
  mime_type: string | null
  uploaded_at: string
  status: 'processing' | 'analyzed' | 'kept'
  ocr: string | null
  analysis: string | null
  summary: string | null
  categories: string[] | null
  tags: string[] | null
  topics: string[] | null
  content_type: string | null
  key_entities: string[] | null
  action_items: string[] | null
  source_hint: string | null
  created_at: string
}
