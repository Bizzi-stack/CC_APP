'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

interface Player {
  id: string
  name: string
  photo_url?: string
}

interface Franchise {
  id: string
  name: string
  logo_url: string | null
}

interface Bid {
  id: string
  player_id: string
  bidder_franchise_id: string
  seller_franchise_id: string | null
  bid_amount: number
  counter_amount: number | null
  status: 'pending' | 'approved' | 'rejected' | 'counter_proposed'
  created_at: string
  player: Player
  bidder: Franchise
  seller: Franchise | null
}

export default function AdminBidsPage() {
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actioning, setActioning] = useState<string | null>(null)

  useEffect(() => {
    fetchBids()
  }, [])

  const fetchBids = async () => {
    try {
      const res = await fetch('/api/admin/bids')
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Unauthorized. Admin access required.')
        }
        throw new Error('Failed to fetch bids')
      }
      const data = await res.json()
      setBids(data.bids || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (bidId: string) => {
    if (!confirm('Are you sure you want to approve this transfer? Credits will be exchanged and the player will be transferred.')) {
      return
    }

    setActioning(bidId)
    try {
      const res = await fetch('/api/admin/bids', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId, status: 'approved' })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to approve bid')
      }

      await fetchBids()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActioning(null)
    }
  }

  const handleReject = async (bidId: string) => {
    if (!confirm('Are you sure you want to reject this transfer bid?')) {
      return
    }

    setActioning(bidId)
    try {
      const res = await fetch('/api/admin/bids', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId, status: 'rejected' })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to reject bid')
      }

      await fetchBids()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActioning(null)
    }
  }

  const handleCounterPropose = async (bidId: string) => {
    const amountStr = prompt('Enter the counter proposal amount (CR):')
    if (amountStr === null) return // Cancelled

    const amount = parseInt(amountStr)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive number.')
      return
    }

    setActioning(bidId)
    try {
      const res = await fetch('/api/admin/bids', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId, status: 'counter_proposed', counterAmount: amount })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send counter proposal')
      }

      await fetchBids()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActioning(null)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a] sticky top-0 bg-black/90 backdrop-blur-md z-10">
        <Link href="/home" className="text-[#888] active:text-white transition-colors p-2 -ml-2">
          ← Back
        </Link>
        <h1 className="font-bold tracking-widest uppercase text-sm">Transfer Bids</h1>
        <div className="w-10" />
      </div>

      <div className="p-4 space-y-4">
        {error && (
          <div className="bg-[#ff4444]/10 border border-[#ff4444] text-[#ff4444] p-3 text-sm text-center">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-28 bg-[#111] animate-pulse border border-[#222]" />
            ))}
          </div>
        ) : bids.length === 0 ? (
          <div className="border border-[#1a1a1a] p-8 text-center text-[#666] uppercase tracking-wider text-xs">
            No transfer bids requested.
          </div>
        ) : (
          <div className="space-y-4">
            {bids.map(bid => (
              <div key={bid.id} className="border border-[#222] bg-[#0a0a0a] p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-[#333] bg-[#111] flex items-center justify-center shrink-0">
                      {bid.player.photo_url ? (
                        <img src={bid.player.photo_url} alt={bid.player.name} className="w-full h-full object-cover object-top" />
                      ) : (
                        <span className="text-[#444] text-xs font-bold uppercase">{bid.player.name.substring(0, 2)}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">{bid.player.name}</h3>
                      <p className="text-[10px] text-[#555] uppercase mt-0.5">Player Target</p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-1 border
                    ${bid.status === 'approved' && 'border-[#2a6b2a] text-[#4caf50] bg-[#0a1f0a]'}
                    ${bid.status === 'rejected' && 'border-[#6b2a2a] text-[#f44336] bg-[#1f0a0a]'}
                    ${bid.status === 'counter_proposed' && 'border-[#6b582a] text-[#ffb74d] bg-[#1f190a]'}
                    ${bid.status === 'pending' && 'border-[#333] text-[#888] bg-[#111]'}
                  `}>
                    {bid.status === 'counter_proposed' ? 'Counter Proposed' : bid.status}
                  </span>
                </div>

                {/* Transfer Details */}
                <div className="grid grid-cols-2 gap-4 border-t border-[#111] pt-3 text-xs">
                  <div>
                    <span className="text-[#555] block uppercase text-[8px] font-bold tracking-wider">Buyer</span>
                    <span className="text-white font-semibold">{bid.bidder.name}</span>
                  </div>
                  <div>
                    <span className="text-[#555] block uppercase text-[8px] font-bold tracking-wider">Seller</span>
                    <span className="text-white font-semibold">{bid.seller?.name || 'Free Agent'}</span>
                  </div>
                  <div>
                    <span className="text-[#555] block uppercase text-[8px] font-bold tracking-wider">Offered Amount</span>
                    <span className="text-white font-mono font-bold">{bid.bid_amount.toLocaleString()} CR</span>
                  </div>
                  {bid.counter_amount && (
                    <div>
                      <span className="text-[#ffb74d] block uppercase text-[8px] font-bold tracking-wider">Counter Proposed</span>
                      <span className="text-[#ffb74d] font-mono font-bold">{bid.counter_amount.toLocaleString()} CR</span>
                    </div>
                  )}
                </div>


              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
