'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import FilterBar from '@/components/FilterBar'
import ItemCard from '@/components/ItemCard'
import ItemCardSkeleton from '@/components/ItemCardSkeleton'
import Pagination from '@/components/Pagination'
import type { CatalogResponse, CatalogItem } from '@/app/api/catalog/route'

function CatalogContent() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<CatalogResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const page = parseInt(searchParams.get('page') || '1', 10)
  const category = searchParams.get('category') || ''
  const priceRange = searchParams.get('priceRange') || ''
  const sort = searchParams.get('sort') || 'best-match'
  const search = searchParams.get('search') || ''

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        params.set('page', page.toString())
        if (category) params.set('category', category)
        if (priceRange) params.set('priceRange', priceRange)
        if (sort) params.set('sort', sort)
        if (search) params.set('search', search)

        const response = await fetch(`/api/catalog?${params.toString()}`)

        if (!response.ok) {
          throw new Error('Failed to fetch catalog data')
        }

        const result: CatalogResponse = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [page, category, priceRange, sort, search])

  if (error) {
    return (
      <div className="min-h-screen bg-[#000000]">
        <div className="flex justify-center items-center py-8">
          <img src="/logo.png" alt="ARTIC" className="h-20 object-contain invert" />
        </div>
        <FilterBar category={category} priceRange={priceRange} sort={sort} search={search} />
        <div className="max-w-[1440px] mx-auto px-6 py-8 text-center">
          <div className="bg-[#1B1B1B] border border-[#2A2A2A] text-[#FF4D4D] px-4 py-3 rounded">
            <p className="font-semibold">Error loading catalog</p>
            <p className="text-[#9A9A9A]">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans">
      {/* Logo Header */}
      <div className="flex justify-center items-center py-4 border-b border-[#333333]">
        {/* Using the uploaded logo. Assuming it has transparency. If it's black text on clear, we might need invert, but user image seemed to be white text or gothic. Let's try raw first. */}
        <img src="/logo.png" alt="ARTIC" className="h-40 object-contain" />
      </div>

      <FilterBar category={category} priceRange={priceRange} sort={sort} search={search} />

      <div className="max-w-[1440px] mx-auto px-6 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ columnGap: '16px', rowGap: '24px' }}>
            {Array.from({ length: 20 }).map((_, i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </div>
        ) : data && data.items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ columnGap: '16px', rowGap: '24px' }}>
              {data.items.map((item: CatalogItem) => (
                <ItemCard
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  image={item.image}
                  sellerName={item.sellerName}
                  sellerBadge={item.sellerBadge}
                  price={item.price}
                  instagramUrl={item.instagramUrl}
                  isFavorited={item.isFavorited}
                />
              ))}
            </div>
            {data.totalPages > 1 && (
              <Pagination currentPage={data.currentPage} totalPages={data.totalPages} />
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="bg-[#1B1B1B] rounded-lg border border-[#2A2A2A] p-8 max-w-md mx-auto">
              <svg
                className="mx-auto h-16 w-16 text-[#7A7A7A] mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="text-lg font-semibold text-[#FFFFFF] mb-2">No items found</h3>
              <p className="text-[#7A7A7A]">
                Try adjusting your filters
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B0B0B]">
          <div className="bg-[#1A1A1A] border-b border-[#2A2A2A]" style={{ height: '56px' }}>
            <div className="max-w-[1440px] mx-auto px-6">
              <div className="h-8 bg-[#2A2A2A] rounded animate-pulse w-32"></div>
            </div>
          </div>
          <div className="max-w-[1440px] mx-auto px-6 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ columnGap: '16px', rowGap: '24px' }}>
              {Array.from({ length: 20 }).map((_, i) => (
                <ItemCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  )
}
