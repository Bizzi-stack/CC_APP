'use client'

import { useCartWishlist } from '@/contexts/CartWishlistContext'
import Link from 'next/link'
import FilterBar from '@/components/FilterBar'

export default function CartPage() {
  const { cart, removeFromCart, getCartTotal, clearCart } = useCartWishlist()
  const total = getCartTotal()

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <FilterBar category="" priceRange="" sort="best-match" search="" />
      
      <div className="max-w-[1440px] mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-[#FFFFFF]">Shopping Cart</h1>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[13px] text-[#9A9A9A] hover:text-[#FFFFFF] transition"
            >
              Clear Cart
            </button>
          )}
        </div>

        {cart.length === 0 ? (
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
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-[#FFFFFF] mb-2">Your cart is empty</h3>
              <p className="text-[#7A7A7A] mb-6">
                Add items to your cart to see them here
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
          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="bg-[#1B1B1B] rounded-[6px] p-4 border border-[#2A2A2A] flex gap-4"
              >
                {/* Item Image */}
                <div className="w-24 h-24 rounded-[4px] overflow-hidden bg-[#2A2A2A] flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Item Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-[13px] font-medium text-[#FFFFFF] mb-1">{item.name}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] text-[#9A9A9A]">by {item.sellerName}</span>
                      {item.sellerBadge && (
                        <span
                          className={`px-[6px] py-[2px] text-[10px] rounded-full font-medium ${
                            item.sellerBadge === 'Pro'
                              ? 'text-[#FFD100] bg-[#2A2A2A]'
                              : 'text-[#4DA3FF] bg-[#2A2A2A]'
                          }`}
                        >
                          {item.sellerBadge}
                        </span>
                      )}
                    </div>
                    <div className="text-[14px] font-semibold text-[#FFFFFF]">
                      Bds ${item.price.toFixed(0)}
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="h-8 px-4 rounded-[4px] bg-[#2A2A2A] text-[#FFFFFF] text-[12px] font-medium hover:bg-[#3A3A3A] transition self-start"
                  aria-label="Remove from cart"
                >
                  Remove
                </button>
              </div>
            ))}

            {/* Cart Summary */}
            <div className="bg-[#1B1B1B] rounded-[6px] p-6 border border-[#2A2A2A] mt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] text-[#9A9A9A]">Subtotal ({cart.length} {cart.length === 1 ? 'item' : 'items'})</span>
                <span className="text-[14px] font-semibold text-[#FFFFFF]">Bds ${total.toFixed(2)}</span>
              </div>
              <button className="w-full h-10 rounded-[4px] bg-[#FFD100] text-[#000000] text-[13px] font-medium hover:bg-[#E6BE00] transition">
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
