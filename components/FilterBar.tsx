'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useCartWishlist } from '@/contexts/CartWishlistContext'

interface FilterBarProps {
  category: string
  priceRange: string
  sort: string
  search: string
}

function FilterBarContent({ category, priceRange, sort, search }: FilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { wishlist } = useCartWishlist()
  const wishlistCount = wishlist.length

  const updateParam = useCallback(
    (key: string, value: string) => {
      // ... (logic remains same, just ensure this function is available)
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        if (value) params.set(key, value)
        else params.delete(key)
        params.set('page', '1')
        router.push(`/catalog?${params.toString()}`)
      }
    },
    [router]
  )

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        if (value) params.set('search', value)
        else params.delete('search')
        params.set('page', '1')
        router.push(`/catalog?${params.toString()}`)
      }
    },
    [router]
  )

  const inputStyle = "h-[30px] rounded-[2px] bg-transparent border border-[#555555] text-[#FFFFFF] text-[13px] font-normal px-3 focus:outline-none cursor-pointer appearance-none bg-no-repeat bg-[length:10px_10px] bg-[right_8px_center]"
  const arrowIcon = "url(\"data:image/svg+xml,%3Csvg width='10' height='10' viewBox='0 0 10 10' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 3.5L5 6.5L8 3.5' stroke='%23FFFFFF' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")"

  return (
    <div className="bg-[#000000] border-b border-[#333333] sticky top-0 z-10 w-full" style={{ height: '50px' }}>
      <div className="h-full px-4 flex items-center justify-between">

        {/* Left: Filters */}
        <div className="flex items-center gap-4">
          {/* 1. Category */}
          <select
            value={category}
            onChange={(e) => updateParam('category', e.target.value)}
            className={`${inputStyle} w-[100px]`}
            style={{ backgroundImage: arrowIcon }}
          >
            <option value="">all</option>
            <option value="clothing">clothing</option>
            <option value="accessories">accessories</option>
            <option value="shoes">shoes</option>
          </select>

          {/* 2. Price */}
          <select
            value={priceRange}
            onChange={(e) => updateParam('priceRange', e.target.value)}
            className={`${inputStyle} w-[120px]`}
            style={{ backgroundImage: arrowIcon }}
          >
            <option value="">all prices</option>
            <option value="0-50">under 50</option>
            <option value="50-100">50 - 100</option>
            <option value="150+">150+</option>
          </select>

          {/* 3. Sort */}
          <select
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className={`${inputStyle} w-[120px]`}
            style={{ backgroundImage: arrowIcon }}
          >
            <option value="best-match">best match</option>
            <option value="price-low">lowest price</option>
            <option value="price-high">highest price</option>
            <option value="name">a - z</option>
          </select>
        </div>

        {/* Right: Search + Heart */}
        <div className="flex items-center gap-4 flex-1 justify-end max-w-[50%]">
          {/* Search */}
          <div className="relative flex-1 max-w-[400px]">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input
              type="text"
              placeholder="search"
              value={search}
              onChange={handleSearch}
              className="w-full h-[30px] bg-transparent border border-[#555555] rounded-[2px] pl-9 pr-3 text-[13px] text-white focus:outline-none placeholder-[#888888]"
            />
          </div>

          {/* Heart */}
          <Link href="/wishlist">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#888888" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function FilterBar(props: FilterBarProps) {
  return (
    <Suspense fallback={
      <div className="bg-[#000000] border-b border-[#333333] sticky top-0 z-10 w-full animate-pulse" style={{ height: '50px' }} />
    }>
      <FilterBarContent {...props} />
    </Suspense>
  )
}
