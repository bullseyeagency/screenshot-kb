import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { deleteFromR2 } from '@/lib/r2'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { status } = body as { status: string }

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('screenshots')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ screenshot: data })
  } catch (error: unknown) {
    console.error('PATCH error:', error)
    const message = error instanceof Error ? error.message : 'An unexpected error occurred'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Fetch record first to get storage_path (R2 key)
    const { data: record, error: fetchError } = await supabase
      .from('screenshots')
      .select('storage_path')
      .eq('id', id)
      .single()

    if (fetchError || !record) {
      return NextResponse.json({ error: 'Screenshot not found' }, { status: 404 })
    }

    // Delete from R2
    try {
      await deleteFromR2(record.storage_path)
    } catch (r2Error) {
      console.error('R2 delete error:', r2Error)
      // Continue to delete DB record even if R2 delete fails
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
