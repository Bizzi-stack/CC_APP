'use client'

import { useCartWishlist } from '@/contexts/CartWishlistContext'
import type { CatalogItem } from '@/app/api/catalog/route'

export interface ItemCardProps {
  id: string
  name: string
  image: string
  sellerName: string
  sellerBadge: 'Pro' | 'Verified' | null
  price: number
  instagramUrl: string
  isFavorited?: boolean
}

export default function ItemCard({
  id,
  name,
  image,
  sellerName,
  sellerBadge,
  price,
  instagramUrl,
  isFavorited: initialFavorited = false,
}: ItemCardProps) {
  const {
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
  } = useCartWishlist()

  const isFavorited = isInWishlist(id)

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const item: CatalogItem = {
      id,
      name,
      image,
      sellerName,
      sellerBadge,
      price,
      instagramUrl,
      isFavorited: !isFavorited,
    }

    if (isFavorited) {
      removeFromWishlist(id)
    } else {
      addToWishlist(item)
    }
  }

  const handleCardClick = () => {
    window.open(instagramUrl, '_blank', 'noopener,noreferrer')
  }

  const getBadgeStyles = () => {
    if (sellerBadge === 'Pro') {
      return 'text-[#FFD100] bg-[#2A2A2A]'
    }
    if (sellerBadge === 'Verified') {
      return 'text-[#4DA3FF] bg-[#2A2A2A]'
    }
    return ''
  }

  return (
    <div
      className="group relative border border-[#333333] bg-black p-4 flex flex-col items-center"
      style={{ width: '100%', aspectRatio: '1/1.2' }}
    >
      {/* Title - Top Center, Uppercase */}
      <h3 className="text-[12px] font-bold text-white uppercase tracking-wider mb-2 text-center w-full truncate">
        {name}
      </h3>

      {/* Image Container */}
      <div className="relative w-full aspect-square mb-2 overflow-hidden bg-[#111]">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-300"
        />
        {/* Favorite Button - Absolute Top Right of Image */}
        <button
          onClick={handleFavorite}
          className="absolute top-2 right-2 text-white/50 hover:text-white transition"
        >
          <svg
            className={`w-5 h-5 ${isFavorited ? 'fill-white text-white' : 'fill-none text-white'}`}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Footer: Price (Coin) and Action (Camera) */}
      <div className="w-full flex items-center justify-between mt-auto pt-2">

        {/* Price Area */}
        <div className="flex items-center gap-2">
          <img src="/coin.png" alt="Coin" className="w-5 h-5 object-contain" />
          <span className="text-[13px] text-white font-medium">
            {price.toFixed(0)} BBD
          </span>
        </div>

        {/* Camera Icon (Instagram Link) */}
        <button
          onClick={handleCardClick}
          className="hover:opacity-80 transition"
        >
          <img src="/camera.png" alt="View" className="w-5 h-5 object-contain" />
        </button>

      </div>
    </div>
  )
}
