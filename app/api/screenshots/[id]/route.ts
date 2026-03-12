import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Fetch record first to get storage_path
    const { data: record, error: fetchError } = await supabase
      .from('screenshots')
      .select('storage_path')
      .eq('id', id)
      .single()

    if (fetchError || !record) {
      return NextResponse.json({ error: 'Screenshot not found' }, { status: 404 })
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('screenshots')
      .remove([record.storage_path])

    if (storageError) {
      console.error('Storage delete error:', storageError)
      // Continue to delete DB record even if storage delete fails
    }

    // Delete from DB
    const { error: dbError } = await supabase
      .from('screenshots')
      .delete()
      .eq('id', id)

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Delete error:', error)
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
