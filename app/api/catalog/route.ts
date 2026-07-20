import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export interface CatalogItem {
  id: string
  name: string
  image: string
  sellerName: string
  sellerBadge: 'Pro' | 'Verified' | null
  price: number
  instagramUrl: string
  isFavorited?: boolean
}

export interface CatalogResponse {
  items: CatalogItem[]
  totalPages: number
  currentPage: number
  totalItems: number
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const category = searchParams.get('category') || undefined
    const priceRange = searchParams.get('priceRange') || undefined
    const search = searchParams.get('search') || undefined
    const sort = searchParams.get('sort') || 'best-match'
    const itemsPerPage = 20

    // Start building the query
    let query = supabase
      .from('catalog_items')
      .select('*', { count: 'exact' })

    // Apply Filters
    if (category) {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    if (priceRange) {
      // Expecting format like "0-50", "50-100", "100+"
      if (priceRange.includes('+')) {
        const min = parseInt(priceRange.split('+')[0])
        query = query.gte('price', min)
      } else if (priceRange.includes('-')) {
        const [min, max] = priceRange.split('-').map(Number)
        query = query.gte('price', min).lte('price', max)
      }
    }

    // Apply Sorting
    switch (sort) {
      case 'price-low':
        query = query.order('price', { ascending: true })
        break
      case 'price-high':
        query = query.order('price', { ascending: false })
        break
      case 'name':
        query = query.order('name', { ascending: true })
        break
      case 'best-match':
      default:
        // Default to newest first
        query = query.order('created_at', { ascending: false })
        break
    }

    // Apply Pagination
    const from = (page - 1) * itemsPerPage
    const to = from + itemsPerPage - 1
    query = query.range(from, to)

    // Execute Query
    const { data: dbItems, error, count } = await query

    if (error) {
      console.error('Supabase fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch items' },
        { status: 500 }
      )
    }

    // Map DB items to Frontend Interface
    const items: CatalogItem[] = (dbItems || []).map(item => ({
      id: item.id,
      name: item.name,
      image: item.image_url, // Mapped from DB column
      sellerName: item.seller_name, // Mapped
      sellerBadge: item.seller_badge, // Mapped
      price: Number(item.price),
      instagramUrl: item.instagram_url, // Mapped
      isFavorited: false, // You would need a separate join/check for this based on user session
    }))

    const totalItems = count || 0
    const totalPages = Math.ceil(totalItems / itemsPerPage)

    const response: CatalogResponse = {
      items,
      totalPages,
      currentPage: page,
      totalItems,
    }

    return NextResponse.json(response)

  } catch (err) {
    console.error('Catalog API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
