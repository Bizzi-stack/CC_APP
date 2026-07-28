'use client'

import React, { useEffect, useState } from 'react'
import { BtcPriceInfo } from '@/lib/btc'

interface BtcTickerProps {
  className?: string
  showConversionHint?: boolean
}

export default function BtcTicker({ className = '', showConversionHint = true }: BtcTickerProps) {
  const [btcData, setBtcData] = useState<BtcPriceInfo | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('circle_btc_price')
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return null
  })
  const [loading, setLoading] = useState(!btcData)

  useEffect(() => {
    let isMounted = true
    const loadBtc = async () => {
      try {
        const res = await fetch('/api/btc-price')
        if (res.ok) {
          const data = await res.json()
          if (isMounted) {
            setBtcData(data)
            try { localStorage.setItem('circle_btc_price', JSON.stringify(data)) } catch {}
          }
        }
      } catch (err) {
        console.error('BTC price fetch error', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadBtc()
    const interval = setInterval(loadBtc, 30000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  if (loading && !btcData) {
    return (
      <div className={`inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg text-[10px] font-mono text-amber-400 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span>Fetching BTC Live Price...</span>
      </div>
    )
  }

  const priceUsd = btcData?.priceUsd || 96500
  const btcFor1m = btcData?.btcFor1mCr || (50 / priceUsd)

  return (
    <div className={`inline-flex flex-col gap-0.5 bg-black/80 border border-amber-500/30 px-3 py-1.5 rounded-xl shadow-lg backdrop-blur-md ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-amber-400 font-extrabold text-xs tracking-wider flex items-center gap-1">
            <span>₿</span> BTC Live:
          </span>
          <span className="text-white font-mono font-bold text-xs">
            ${priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {showConversionHint && (
        <div className="text-[9px] text-[#aaa] font-mono flex items-center gap-1">
          <span className="text-amber-300 font-bold">1,000,000 CR</span>
          <span>=</span>
          <span className="text-emerald-400 font-bold">$50</span>
          <span>(≈ {btcFor1m.toFixed(6)} BTC)</span>
        </div>
      )}
    </div>
  )
}
