'use client'

import React, { useState, useId } from 'react'

export interface StockFranchise {
  id: string
  name: string
  logo_url?: string
  wins?: number
  roster_count?: number
  total_valuation: number
  share_price: number
  user_shares_count?: number
  listings?: any[]
}

interface FranchiseStockChartProps {
  franchise: StockFranchise
  userBalance?: number
  onBuySuccess?: () => void
}

// Generate realistic deterministic chart price history based on franchise properties
function generateStockHistory(basePrice: number, seedStr: string) {
  const points: number[] = []
  let current = basePrice * 0.82 // Start 18% lower 7 days ago

  let hash = 0
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i)
    hash |= 0
  }

  const stepCount = 12
  for (let i = 0; i < stepCount; i++) {
    const pseudoRandom = Math.abs(Math.sin(hash + i * 999))
    const variation = (pseudoRandom - 0.42) * (basePrice * 0.06)
    current = Math.max(10, current + variation)
    points.push(current)
  }

  // Ensure last point hits exact current share price
  points[points.length - 1] = basePrice
  return points
}

export default function FranchiseStockChart({ franchise, userBalance = 0, onBuySuccess }: FranchiseStockChartProps) {
  const [timeframe, setTimeframe] = useState<'1D' | '7D' | '1M' | 'ALL'>('7D')
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false)
  const [isSellModalOpen, setIsSellModalOpen] = useState(false)

  // Buy State
  const [shareQty, setShareQty] = useState(1)
  const [buying, setBuying] = useState(false)

  // Sell State
  const [sellQty, setSellQty] = useState(1)
  const [selling, setSelling] = useState(false)

  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const gradientId = useId()

  const history = generateStockHistory(franchise.share_price, franchise.id + timeframe)
  const minPrice = Math.min(...history)
  const maxPrice = Math.max(...history)
  const priceRange = Math.max(1, maxPrice - minPrice)

  const firstPrice = history[0]
  const lastPrice = history[history.length - 1]
  const priceDiff = lastPrice - firstPrice
  const percentChange = ((priceDiff / firstPrice) * 100).toFixed(1)
  const isPositive = priceDiff >= 0

  // SVG Chart path calculations
  const chartHeight = 80
  const chartWidth = 300
  const pointsString = history.map((val, idx) => {
    const x = (idx / (history.length - 1)) * chartWidth
    const y = chartHeight - ((val - minPrice) / priceRange) * (chartHeight - 16) - 8
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')

  const areaPointsString = `0,${chartHeight} ${pointsString} ${chartWidth},${chartHeight}`

  const totalCost = shareQty * franchise.share_price
  const canAfford = userBalance >= totalCost

  const userOwnedShares = franchise.user_shares_count || 0
  const totalSellPayout = sellQty * franchise.share_price

  const handleBuySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBuying(true)
    setError('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/franchise/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'buy_primary',
          franchise_id: franchise.id,
          shares_count: shareQty
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to purchase shares')

      setSuccessMsg(data.message || `Successfully purchased ${shareQty} shares!`)
      if (onBuySuccess) onBuySuccess()
    } catch (err: any) {
      setError(err.message || 'Purchase error')
    } finally {
      setBuying(false)
    }
  }

  const handleSellSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSelling(true)
    setError('')
    setSuccessMsg('')

    try {
      const res = await fetch('/api/franchise/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sell_instant',
          franchise_id: franchise.id,
          shares_count: sellQty
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to sell shares')

      setSuccessMsg(data.message || `Successfully sold ${sellQty} shares for ${totalSellPayout.toLocaleString()} CR!`)
      if (onBuySuccess) onBuySuccess()
    } catch (err: any) {
      setError(err.message || 'Selling error')
    } finally {
      setSelling(false)
    }
  }

  return (
    <div className="bg-[#0a0a0b] border border-[#222] hover:border-[#333] p-5 rounded-2xl shadow-2xl transition-all space-y-4 text-left">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {franchise.logo_url ? (
            <img src={franchise.logo_url} alt="" className="w-11 h-11 rounded-full object-cover border border-[#333] shadow-md" />
          ) : (
            <div className="w-11 h-11 rounded-full bg-[#181818] border border-[#333] flex items-center justify-center font-bold text-[#888] shadow-md">
              {franchise.name.substring(0, 2)}
            </div>
          )}
          <div>
            <h4 className="text-base font-extrabold text-white uppercase tracking-wide">
              {franchise.name}
            </h4>
            <div className="flex items-center gap-2 text-[10px] text-[#777] uppercase font-mono">
              <span>Valuation: {franchise.total_valuation.toLocaleString()} CR</span>
              <span>·</span>
              <span>{franchise.wins || 0} Wins</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-mono font-black text-emerald-400">
            {franchise.share_price.toLocaleString()} CR
          </div>
          <div className={`text-[10px] font-mono font-bold flex items-center justify-end gap-1 ${
            isPositive ? 'text-emerald-400' : 'text-red-400'
          }`}>
            <span>{isPositive ? '▲' : '▼'}</span>
            <span>{isPositive ? `+${percentChange}%` : `${percentChange}%`}</span>
            <span className="text-[#555] font-normal">({timeframe})</span>
          </div>
        </div>
      </div>

      {/* SVG Interactive Price Chart */}
      <div className="bg-black/80 border border-[#1a1a1a] p-3 rounded-xl space-y-2 relative overflow-hidden">
        <div className="flex items-center justify-between text-[9px] font-mono text-[#666]">
          <span>PRICE HISTORY ({timeframe})</span>
          <div className="flex gap-1">
            {(['1D', '7D', '1M', 'ALL'] as const).map(tf => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono transition-colors ${
                  timeframe === tf ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-[#555] hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Chart Graphic */}
        <div className="w-full h-20 pt-1">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity="0.4" />
                <stop offset="100%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Shaded area */}
            <polygon points={areaPointsString} fill={`url(#${gradientId})`} />

            {/* Line path */}
            <polyline
              fill="none"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pointsString}
            />

            {/* End point pulse marker */}
            {pointsString.split(' ').pop() && (() => {
              const [lastX, lastY] = pointsString.split(' ').pop()!.split(',').map(Number)
              return (
                <circle
                  cx={lastX}
                  cy={lastY}
                  r="4"
                  fill={isPositive ? '#10b981' : '#ef4444'}
                  className="animate-ping"
                />
              )
            })()}
          </svg>
        </div>
      </div>

      {/* Equity Holdings & Action Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-[#141414]">
        <div className="text-[10px] font-mono text-[#888]">
          <span>Your Owned Equity: </span>
          <span className="text-white font-bold">{userOwnedShares}% ({userOwnedShares} Shares)</span>
        </div>

        <div className="flex items-center gap-2">
          {userOwnedShares > 0 && (
            <button
              type="button"
              onClick={() => {
                setSellQty(Math.min(1, userOwnedShares))
                setError('')
                setSuccessMsg('')
                setIsSellModalOpen(true)
              }}
              className="h-9 px-4 bg-amber-500/10 border border-amber-500/40 hover:bg-amber-500/20 text-amber-300 text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
            >
              <span>💸</span>
              <span>Sell Shares</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setError('')
              setSuccessMsg('')
              setIsBuyModalOpen(true)
            }}
            className="h-9 px-4 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:brightness-110 text-black text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
          >
            <span>📈</span>
            <span>Buy Shares ({franchise.share_price.toLocaleString()} CR)</span>
          </button>
        </div>
      </div>

      {/* Buy Shares Modal */}
      {isBuyModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsBuyModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#0c0c0d] border border-emerald-500/40 p-6 rounded-2xl shadow-2xl space-y-4 text-left"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div className="flex items-center gap-2.5">
                {franchise.logo_url && (
                  <img src={franchise.logo_url} alt="" className="w-8 h-8 rounded-full object-cover border border-[#333]" />
                )}
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wider">
                    Buy {franchise.name} Shares
                  </h3>
                  <p className="text-[9px] text-[#888] font-mono">
                    Franchise Equity Market · 20% Match Dividends
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBuyModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#1c1c1c] text-[#aaa] hover:text-white flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {successMsg ? (
              <div className="bg-emerald-950/30 border border-emerald-500/40 p-4 rounded-xl space-y-3 text-center">
                <div className="text-3xl">🎉</div>
                <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wide">
                  Share Purchase Complete!
                </h4>
                <p className="text-xs text-[#ccc] leading-relaxed">{successMsg}</p>
                <button
                  type="button"
                  onClick={() => setIsBuyModalOpen(false)}
                  className="w-full h-10 bg-emerald-500 text-black text-xs font-black uppercase tracking-wider rounded-xl"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleBuySubmit} className="space-y-4">
                <div className="bg-black border border-[#222] p-3 rounded-xl space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-[#888]">
                    <span>Current Share Price:</span>
                    <span className="text-emerald-400 font-bold">{franchise.share_price.toLocaleString()} CR</span>
                  </div>
                  <div className="flex justify-between text-[#888]">
                    <span>Your Available Balance:</span>
                    <span className="text-white font-bold">{userBalance.toLocaleString()} CR</span>
                  </div>
                  <div className="flex justify-between border-t border-[#222] pt-2 text-sm">
                    <span className="text-[#aaa]">Total Investment:</span>
                    <span className="text-emerald-400 font-black">{totalCost.toLocaleString()} CR</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#888] tracking-wider uppercase block">
                    Select Shares Quantity (1 Share = 1% Equity)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 5, 10, 25].map(qty => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setShareQty(qty)}
                        className={`h-9 rounded-lg font-mono text-xs font-bold transition-all border ${
                          shareQty === qty
                            ? 'bg-emerald-500 text-black border-emerald-400 font-black'
                            : 'bg-black border-[#333] text-[#aaa] hover:text-white'
                        }`}
                      >
                        {qty} {qty === 1 ? 'Share' : 'Shares'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-[#666] uppercase font-mono">Custom Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={shareQty}
                    onChange={e => setShareQty(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                    className="w-full h-10 px-3 bg-black border border-[#333] text-white text-xs font-mono rounded-xl outline-none focus:border-emerald-400"
                  />
                </div>

                {error && (
                  <div className="border border-red-900 bg-red-950/20 text-red-400 text-xs p-3 rounded-xl">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canAfford || buying}
                  className="w-full h-11 bg-gradient-to-r from-emerald-500 to-emerald-400 text-black text-xs font-black tracking-widest uppercase rounded-xl shadow-lg transition-all disabled:opacity-40 hover:brightness-110"
                >
                  {buying ? 'Executing Order...' : `Buy ${shareQty} Shares (${totalCost.toLocaleString()} CR)`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Sell Shares Modal */}
      {isSellModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsSellModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#0c0c0d] border border-amber-500/40 p-6 rounded-2xl shadow-2xl space-y-4 text-left"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div className="flex items-center gap-2.5">
                {franchise.logo_url && (
                  <img src={franchise.logo_url} alt="" className="w-8 h-8 rounded-full object-cover border border-[#333]" />
                )}
                <div>
                  <h3 className="text-sm font-black uppercase text-amber-300 tracking-wider">
                    Sell {franchise.name} Shares
                  </h3>
                  <p className="text-[9px] text-[#888] font-mono">
                    Instant Cash Out to Wallet Balance
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSellModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#1c1c1c] text-[#aaa] hover:text-white flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {successMsg ? (
              <div className="bg-emerald-950/30 border border-emerald-500/40 p-4 rounded-xl space-y-3 text-center">
                <div className="text-3xl">💵</div>
                <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wide">
                  Shares Sold Successfully!
                </h4>
                <p className="text-xs text-[#ccc] leading-relaxed">{successMsg}</p>
                <button
                  type="button"
                  onClick={() => setIsSellModalOpen(false)}
                  className="w-full h-10 bg-amber-500 text-black text-xs font-black uppercase tracking-wider rounded-xl"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSellSubmit} className="space-y-4">
                <div className="bg-black border border-[#222] p-3 rounded-xl space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-[#888]">
                    <span>Current Share Market Price:</span>
                    <span className="text-emerald-400 font-bold">{franchise.share_price.toLocaleString()} CR</span>
                  </div>
                  <div className="flex justify-between text-[#888]">
                    <span>Your Owned Shares:</span>
                    <span className="text-amber-300 font-bold">{userOwnedShares} Shares</span>
                  </div>
                  <div className="flex justify-between border-t border-[#222] pt-2 text-sm">
                    <span className="text-[#aaa]">Instant Cash Out Payout:</span>
                    <span className="text-amber-400 font-black">+{totalSellPayout.toLocaleString()} CR</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#888] tracking-wider uppercase block">
                    Select Quantity of Shares to Sell
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max={userOwnedShares}
                      value={sellQty}
                      onChange={e => setSellQty(Math.max(1, Math.min(userOwnedShares, parseInt(e.target.value) || 1)))}
                      className="w-full h-11 px-3 bg-black border border-[#333] text-white text-xs font-mono rounded-xl outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => setSellQty(userOwnedShares)}
                      className="h-11 px-4 bg-[#1c1c1c] border border-[#333] hover:bg-[#2a2a2a] text-amber-300 text-xs font-bold uppercase rounded-xl shrink-0"
                    >
                      Sell All ({userOwnedShares})
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="border border-red-900 bg-red-950/20 text-red-400 text-xs p-3 rounded-xl">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={selling || sellQty <= 0 || sellQty > userOwnedShares}
                  className="w-full h-11 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black text-xs font-black tracking-widest uppercase rounded-xl shadow-lg transition-all disabled:opacity-40 hover:brightness-110"
                >
                  {selling ? 'Processing Sale...' : `Instant Sell ${sellQty} Shares (+${totalSellPayout.toLocaleString()} CR)`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
