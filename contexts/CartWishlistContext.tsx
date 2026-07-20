'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { CatalogItem } from '@/app/api/catalog/route'

interface CartWishlistContextType {
  cart: CatalogItem[]
  wishlist: CatalogItem[]
  addToCart: (item: CatalogItem) => void
  removeFromCart: (itemId: string) => void
  addToWishlist: (item: CatalogItem) => void
  removeFromWishlist: (itemId: string) => void
  isInCart: (itemId: string) => boolean
  isInWishlist: (itemId: string) => boolean
  clearCart: () => void
  getCartTotal: () => number
  getCartItemCount: () => number
}

const CartWishlistContext = createContext<CartWishlistContextType | undefined>(undefined)

export function CartWishlistProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CatalogItem[]>([])
  const [wishlist, setWishlist] = useState<CatalogItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCart = localStorage.getItem('catalog_cart')
      const savedWishlist = localStorage.getItem('catalog_wishlist')
      
      if (savedCart) {
        try {
          setCart(JSON.parse(savedCart))
        } catch (e) {
          console.error('Error loading cart from localStorage', e)
        }
      }
      
      if (savedWishlist) {
        try {
          setWishlist(JSON.parse(savedWishlist))
        } catch (e) {
          console.error('Error loading wishlist from localStorage', e)
        }
      }
      
      setIsLoaded(true)
    }
  }, [])

  // Save to localStorage whenever cart or wishlist changes
  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('catalog_cart', JSON.stringify(cart))
    }
  }, [cart, isLoaded])

  useEffect(() => {
    if (isLoaded && typeof window !== 'undefined') {
      localStorage.setItem('catalog_wishlist', JSON.stringify(wishlist))
    }
  }, [wishlist, isLoaded])

  const addToCart = useCallback((item: CatalogItem) => {
    setCart((prevCart) => {
      // Check if item already exists in cart
      if (prevCart.find((cartItem) => cartItem.id === item.id)) {
        return prevCart // Don't add duplicates
      }
      return [...prevCart, item]
    })
  }, [])

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId))
  }, [])

  const addToWishlist = useCallback((item: CatalogItem) => {
    setWishlist((prevWishlist) => {
      // Check if item already exists in wishlist
      if (prevWishlist.find((wishlistItem) => wishlistItem.id === item.id)) {
        return prevWishlist // Don't add duplicates
      }
      return [...prevWishlist, item]
    })
  }, [])

  const removeFromWishlist = useCallback((itemId: string) => {
    setWishlist((prevWishlist) => prevWishlist.filter((item) => item.id !== itemId))
  }, [])

  const isInCart = useCallback(
    (itemId: string) => {
      return cart.some((item) => item.id === itemId)
    },
    [cart]
  )

  const isInWishlist = useCallback(
    (itemId: string) => {
      return wishlist.some((item) => item.id === itemId)
    },
    [wishlist]
  )

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => total + item.price, 0)
  }, [cart])

  const getCartItemCount = useCallback(() => {
    return cart.length
  }, [cart])

  return (
    <CartWishlistContext.Provider
      value={{
        cart,
        wishlist,
        addToCart,
        removeFromCart,
        addToWishlist,
        removeFromWishlist,
        isInCart,
        isInWishlist,
        clearCart,
        getCartTotal,
        getCartItemCount,
      }}
    >
      {children}
    </CartWishlistContext.Provider>
  )
}

export function useCartWishlist() {
  const context = useContext(CartWishlistContext)
  if (context === undefined) {
    throw new Error('useCartWishlist must be used within a CartWishlistProvider')
  }
  return context
}
