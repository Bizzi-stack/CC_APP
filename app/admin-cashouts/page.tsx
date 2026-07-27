'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import BtcTicker from '@/components/BtcTicker'

interface CashoutRequest {
  id: string
  player_id: string
  cr_amount: number
  usd_value: number
  btc_amount: number
  btc_price_usd: number
  btc_address: string
  status: 'pending' | 'completed' | 'approved' | 'rejected'
  created_at: string
  players?: {
    name: string
    photo_url?: string
    country?: string
  }
}

export default function AdminCashoutsPage() {
  const [cashouts, setCashouts] = useState<CashoutRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending')
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchCashouts()
  }, [])

  const fetchCashouts = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/cashouts')
      const data = await res.json()
      setCashouts(data.cashouts || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: 'completed' | 'rejected') => {
    setActioningId(id)
    setMessage('')
    try {
      const res = await fetch('/api/admin/cashouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update')

      setCashouts(prev => prev.map(c => c.id === id ? { ...c, status } : c))
      setMessage(`Successfully updated cashout to ${status.toUpperCase()}!`)
    } catch (err: any) {
      alert(err.message || 'Error updating status')
    } finally {
      setActioningId(null)
    }
  }

  const copyAddress = (address: string, id: string) => {
    navigator.clipboard.writeText(address)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredCashouts = cashouts.filter(c => {
    if (filter === 'pending') return c.status === 'pending'
    if (filter === 'completed') return c.status === 'completed' || c.status === 'approved'
    return true
  })

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-24 max-w-5xl mx-auto px-4 pt-8">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1c1c1c] pb-5 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/players"
            className="h-9 px-3.5 bg-[#111] hover:bg-[#222] border border-[#262626] rounded-xl text-xs font-bold uppercase tracking-wider text-[#aaa] hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <span>←</span> Players Admin
          </Link>
          <div className="h-4 w-[1px] bg-[#222]" />
          <div>
            <h1 className="text-lg font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <span>₿</span> BTC Payout Manager
            </h1>
            <p className="text-[10px] text-[#777] font-mono">1,000,000 CR = $50.00 Redemption Requests</p>
          </div>
        </div>

        <BtcTicker showConversionHint={false} />
      </div>

      {message && (
        <div className="mb-6 p-3.5 bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2">
          <span>✓</span> {message}
        </div>
      )}

      {/* Segmented Filter Control */}
      <div className="bg-[#0f0f10] border border-[#222] p-1.5 rounded-2xl flex items-center gap-1 mb-6 max-w-md">
        <button
          onClick={() => setFilter('pending')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            filter === 'pending'
              ? 'bg-amber-500 text-black shadow-lg font-black'
              : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'
          }`}
        >
          <span>Pending</span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
            filter === 'pending' ? 'bg-black/20 text-black font-extrabold' : 'bg-[#222] text-[#aaa]'
          }`}>
            {cashouts.filter(c => c.status === 'pending').length}
          </span>
        </button>

        <button
          onClick={() => setFilter('completed')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            filter === 'completed'
              ? 'bg-emerald-500 text-black shadow-lg font-black'
              : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'
          }`}
        >
          <span>Paid / Approved</span>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
            filter === 'completed' ? 'bg-black/20 text-black font-extrabold' : 'bg-[#222] text-[#aaa]'
          }`}>
            {cashouts.filter(c => c.status === 'completed' || c.status === 'approved').length}
          </span>
        </button>

        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            filter === 'all'
              ? 'bg-white text-black shadow-lg font-black'
              : 'text-[#888] hover:text-white hover:bg-[#1a1a1a]'
          }`}
        >
          All ({cashouts.length})
        </button>
      </div>

      {/* Request Cards Container */}
      {loading ? (
        <div className="p-16 text-center text-[#555] text-xs uppercase tracking-widest animate-pulse font-mono">
          Loading requests from database...
        </div>
      ) : filteredCashouts.length === 0 ? (
        <div className="p-16 text-center border border-[#1a1a1a] rounded-2xl bg-[#0a0a0a]">
          <p className="text-[#666] text-sm font-semibold">No cash out requests match this filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCashouts.map(req => {
            const isPending = req.status === 'pending'
            const isCompleted = req.status === 'completed' || req.status === 'approved'
            const isRejected = req.status === 'rejected'

            return (
              <div
                key={req.id}
                className="bg-[#0d0d0e] border border-[#222] hover:border-amber-500/30 rounded-2xl p-5 shadow-xl transition-all space-y-4"
              >
                {/* Header Row: Player Info & Status */}
                <div className="flex items-center justify-between border-b border-[#1c1c1c] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-[#333] bg-[#161616] overflow-hidden shrink-0">
                      {req.players?.photo_url ? (
                        <img src={req.players.photo_url} alt="" className="w-full h-full object-cover object-top" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-amber-400 font-bold text-sm">
                          ₿
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white uppercase tracking-wide">
                        {req.players?.name || 'Player'}
                      </h3>
                      <p className="text-[10px] text-[#666] font-mono">
                        Requested: {new Date(req.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                    isCompleted ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' :
                    isRejected ? 'bg-red-500/10 border-red-500/40 text-red-400' :
                    'bg-amber-500/10 border-amber-500/40 text-amber-300 animate-pulse'
                  }`}>
                    {req.status}
                  </span>
                </div>

                {/* Body Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Conversion Breakdown */}
                  <div className="bg-black/60 border border-[#1a1a1a] p-3.5 rounded-xl space-y-2">
                    <div className="text-[10px] font-bold text-[#666] uppercase tracking-wider">
                      Payout Calculation
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="text-emerald-400 font-extrabold">
                        {Number(req.cr_amount).toLocaleString()} CR
                      </span>
                      <span className="text-[#555]">=</span>
                      <span className="text-amber-300 font-extrabold">
                        ${Number(req.usd_value).toFixed(2)}
                      </span>
                      <span className="text-[#555]">→</span>
                      <span className="text-white font-black bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-md">
                        {Number(req.btc_amount).toFixed(6)} BTC
                      </span>
                    </div>

                    <p className="text-[9px] text-[#666] font-mono pt-1">
                      Recorded Spot Rate: ${Number(req.btc_price_usd).toLocaleString()} USD / BTC
                    </p>
                  </div>

                  {/* Right Column: Wallet & Actions */}
                  <div className="bg-black/60 border border-[#1a1a1a] p-3.5 rounded-xl flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-[#666] uppercase tracking-wider">
                        Destination Wallet Address
                      </div>
                      <div className="flex items-center justify-between gap-2 bg-[#121212] border border-[#262626] p-2 rounded-lg font-mono text-xs">
                        <span className="text-amber-300 truncate" title={req.btc_address}>
                          {req.btc_address}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyAddress(req.btc_address, req.id)}
                          className="text-[10px] font-extrabold text-[#aaa] hover:text-white uppercase bg-[#222] hover:bg-[#333] px-2.5 py-1 rounded transition-colors shrink-0"
                        >
                          {copiedId === req.id ? 'Copied ✓' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {isPending && (
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={actioningId === req.id}
                          onClick={() => updateStatus(req.id, 'completed')}
                          className="flex-1 h-9 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black tracking-wider uppercase rounded-lg transition-all disabled:opacity-40"
                        >
                          Approve & Mark Paid
                        </button>
                        <button
                          type="button"
                          disabled={actioningId === req.id}
                          onClick={() => updateStatus(req.id, 'rejected')}
                          className="h-9 px-3 border border-red-500/50 text-red-400 hover:bg-red-950/40 text-xs font-bold uppercase tracking-wider rounded-lg transition-all disabled:opacity-40"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
