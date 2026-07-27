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
    <div className="min-h-screen bg-black text-white pb-24 max-w-4xl mx-auto px-4 pt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#222] pb-6 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/players" className="text-xs font-bold text-[#888] hover:text-white uppercase tracking-wider">
              ← Players Admin
            </Link>
            <span className="text-[#333]">·</span>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
              <span>₿</span> BTC Payout Manager
            </span>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-wide">
            Player Cash Out Requests
          </h1>
          <p className="text-xs text-[#666] mt-1">
            Review player 1,000,000 CR ($50 USD in BTC) redemption requests
          </p>
        </div>

        <BtcTicker showConversionHint={false} />
      </div>

      {message && (
        <div className="mb-6 p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs font-bold rounded-xl">
          ✓ {message}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex border-b border-[#222] mb-6">
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
            filter === 'pending' ? 'border-amber-400 text-amber-300' : 'border-transparent text-[#666] hover:text-white'
          }`}
        >
          <span>Pending</span>
          <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
            {cashouts.filter(c => c.status === 'pending').length}
          </span>
        </button>

        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
            filter === 'completed' ? 'border-emerald-400 text-emerald-300' : 'border-transparent text-[#666] hover:text-white'
          }`}
        >
          <span>Paid / Approved</span>
          <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-mono">
            {cashouts.filter(c => c.status === 'completed' || c.status === 'approved').length}
          </span>
        </button>

        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
            filter === 'all' ? 'border-white text-white' : 'border-transparent text-[#666] hover:text-white'
          }`}
        >
          All Requests ({cashouts.length})
        </button>
      </div>

      {/* Request List */}
      {loading ? (
        <div className="p-12 text-center text-[#555] text-xs uppercase tracking-widest animate-pulse">
          Loading cash out requests...
        </div>
      ) : filteredCashouts.length === 0 ? (
        <div className="p-12 text-center border border-[#1a1a1a] rounded-2xl bg-[#080808]">
          <p className="text-[#666] text-sm">No cash out requests in this category.</p>
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
                className="bg-[#0b0b0b] border border-[#222] hover:border-[#333] rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
              >
                {/* Player & Request info */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full border border-[#333] bg-[#111] overflow-hidden shrink-0">
                    {req.players?.photo_url ? (
                      <img src={req.players.photo_url} alt="" className="w-full h-full object-cover object-top" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-amber-400 font-bold">
                        ₿
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white uppercase">{req.players?.name || 'Player'}</h3>
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                        isCompleted ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400' :
                        isRejected ? 'bg-red-950/60 border-red-500/40 text-red-400' :
                        'bg-amber-950/60 border-amber-500/40 text-amber-300 animate-pulse'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="text-emerald-400 font-bold">{Number(req.cr_amount).toLocaleString()} CR</span>
                      <span className="text-[#444]">=</span>
                      <span className="text-amber-300 font-bold">${Number(req.usd_value).toFixed(2)} USD</span>
                      <span className="text-[#444]">→</span>
                      <span className="text-white font-bold bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                        {Number(req.btc_amount).toFixed(6)} BTC
                      </span>
                    </div>

                    <p className="text-[10px] text-[#666] font-mono">
                      Spot BTC Price: ${Number(req.btc_price_usd).toLocaleString()} USD · {new Date(req.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Wallet Address & Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t md:border-t-0 border-[#1a1a1a] pt-3 md:pt-0">
                  <div className="bg-black border border-[#222] p-2.5 rounded-xl flex items-center justify-between gap-2 max-w-xs font-mono text-[11px]">
                    <span className="text-amber-300 truncate" title={req.btc_address}>{req.btc_address}</span>
                    <button
                      type="button"
                      onClick={() => copyAddress(req.btc_address, req.id)}
                      className="text-[10px] font-bold text-[#888] hover:text-white uppercase shrink-0 bg-[#1c1c1c] px-2 py-1 rounded transition-colors"
                    >
                      {copiedId === req.id ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>

                  {isPending && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={actioningId === req.id}
                        onClick={() => updateStatus(req.id, 'completed')}
                        className="flex-1 sm:flex-none h-10 px-4 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold tracking-wider uppercase rounded-xl transition-all disabled:opacity-40"
                      >
                        Approve & Mark Paid
                      </button>
                      <button
                        type="button"
                        disabled={actioningId === req.id}
                        onClick={() => updateStatus(req.id, 'rejected')}
                        className="flex-1 sm:flex-none h-10 px-3 border border-red-500/50 text-red-400 hover:bg-red-950/40 text-xs font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-40"
                      >
                        Reject & Refund
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
