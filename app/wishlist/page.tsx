'use client'

import { useCartWishlist } from '@/contexts/CartWishlistContext'
import Link from 'next/link'
import FilterBar from '@/components/FilterBar'
import ItemCard from '@/components/ItemCard'

export default function WishlistPage() {
  const { wishlist } = useCartWishlist()

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <FilterBar category="" priceRange="" sort="best-match" search="" />
      
      <div className="max-w-[1440px] mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-[#FFFFFF]">My Wishlist</h1>
          {wishlist.length > 0 && (
            <span className="text-[13px] text-[#9A9A9A]">
              {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-[#1B1B1B] rounded-lg border border-[#2A2A2A] p-8 max-w-md mx-auto">
              <svg
                className="mx-auto h-16 w-16 text-[#7A7A7A] mb-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <h3 className="text-lg font-semibold text-[#FFFFFF] mb-2">Your wishlist is empty</h3>
              <p className="text-[#7A7A7A] mb-6">
                Save items you love to your wishlist
              </p>
              <Link
                href="/catalog"
                className="inline-block px-6 py-2 bg-[#FFD100] text-[#000000] rounded-[4px] text-[13px] font-medium hover:bg-[#E6BE00] transition"
              >
                Browse Catalog
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" style={{ columnGap: '16px', rowGap: '24px' }}>
            {wishlist.map((item) => (
              <ItemCard
                key={item.id}
                id={item.id}
                name={item.name}
                image={item.image}
                sellerName={item.sellerName}
                sellerBadge={item.sellerBadge}
                price={item.price}
                instagramUrl={item.instagramUrl}
                isFavorited={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
