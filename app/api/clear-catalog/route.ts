import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
    try {
        // Attempt to delete all rows where id is not null (effectively all rows)
        const { data, error } = await supabase
            .from('catalog_items')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000') // Hack to match all UUIDs
            .select()

        if (error) {
            return NextResponse.json({ status: 'error', message: error.message, details: error }, { status: 500 })
        }

        return NextResponse.json({ status: 'success', message: 'Catalog cleared', deleted_count: data?.length || 0, data })
    } catch (err: any) {
        return NextResponse.json({ status: 'exception', message: err.message }, { status: 500 })
    }
}
