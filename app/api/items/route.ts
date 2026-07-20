import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            name,
            image_url,
            seller_name,
            seller_badge,
            price,
            instagram_url,
            category
        } = body

        // basic validation
        if (!name || !image_url || !seller_name || !price || !instagram_url) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const { data, error } = await supabase
            .from('catalog_items')
            .insert([
                {
                    name,
                    image_url,
                    seller_name,
                    seller_badge: seller_badge || null,
                    price: parseFloat(price),
                    instagram_url,
                    category,
                },
            ])
            .select()

        if (error) {
            console.error('Supabase insert error:', error)
            return NextResponse.json(
                { error: `Insert failed: ${error.message}` },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, data })

    } catch (error) {
        console.error('Create item error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
