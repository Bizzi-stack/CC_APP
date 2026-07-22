'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { requestNotificationPermission, sendNativeNotification } from '@/lib/notifications'

interface Player {
  id: string
  name: string
  position?: string
  photo_url?: string
  value: number
  available: boolean
  franchise_id?: string
  franchises?: {
    id: string
    name: string
  } | null
}

interface Franchise {
  id: string
  name: string
  logo_url: string | null
  budget: number
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

type Tab = 'roster' | 'market' | 'bids'

export default function FranchisePortalPage() {
  const router = useRouter()
  const [franchise, setFranchise] = useState<Franchise | null>(null)
  const [roster, setRoster] = useState<Player[]>([])
  const [marketPlayers, setMarketPlayers] = useState<Player[]>([])
  const [outgoingBids, setOutgoingBids] = useState<Bid[]>([])
  const [incomingBids, setIncomingBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [actioning, setActioning] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('roster')
  const [error, setError] = useState('')

  // Bidding modal state
  const [biddingPlayer, setBiddingPlayer] = useState<Player | null>(null)
  const [customBidAmount, setCustomBidAmount] = useState('')

  const [contractOffers, setContractOffers] = useState<any[]>([])

  useEffect(() => {
    fetchPortalData()
  }, [])

  const fetchPortalData = async () => {
    try {
      const [meRes, playersRes, bidsRes, offersRes] = await Promise.all([
        fetch('/api/franchise/me'),
        fetch('/api/players'),
        fetch('/api/franchise/bids'),
        fetch('/api/franchise/offer')
      ])

      if (!meRes.ok) {
        if (meRes.status === 401) {
          router.push('/franchise-login')
          return
        }
        throw new Error('Failed to fetch franchise data')
      }

      const meData = await meRes.json()
      const playersData = await playersRes.json()
      const bidsData = await bidsRes.json()
      const offersData = await offersRes.json()

      const currentFranchise = meData.franchise
      setFranchise(currentFranchise)
      setRoster(meData.roster || [])

      // Market players: active players that do NOT belong to this franchise
      const allActive = (playersData.players || []).filter((p: Player) => p.franchise_id !== currentFranchise.id)
      setMarketPlayers(allActive)

      setOutgoingBids(bidsData.outgoingBids || [])
      setIncomingBids(bidsData.incomingBids || [])
      setContractOffers(offersData.offers || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignPlayer = async (player: Player) => {
    if (!franchise) return
    if (franchise.budget < player.value) {
      alert(`Insufficient credits! This player costs ${player.value.toLocaleString()} CR but you only have ${franchise.budget.toLocaleString()} CR remaining.`)
      return
    }

    const wageStr = prompt(`Send signing contract proposal to ${player.name}.\nProposed daily wage (minimum 100 CR):`, Math.max(100, Math.floor(player.value * 0.1)).toString())
    if (wageStr === null) return // Cancelled
    const wage = parseInt(wageStr)
    if (isNaN(wage) || wage < 100) {
      alert("Please enter a valid daily wage of at least 100 CR.")
      return
    }

    setActioning(player.id)
    try {
      const res = await fetch('/api/franchise/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: player.id, offeredWage: wage })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send contract offer')
      }

      alert(`Contract offer of ${wage.toLocaleString()} CR/day sent to ${player.name}! The player can now accept, decline, or negotiate their wage in their portal.`)
      await fetchPortalData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActioning(null)
    }
  }

  const handleAcceptCounterOffer = async (offerId: string) => {
    setActioning(offerId)
    try {
      const res = await fetch('/api/franchise/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId, action: 'accept_counter' })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to accept counter-offer')

      alert(data.message || 'Counter-offer accepted and player signed!')
      await fetchPortalData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActioning(null)
    }
  }

  const handleRejectContractOffer = async (offerId: string) => {
    setActioning(offerId)
    try {
      const res = await fetch('/api/franchise/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId, action: 'reject' })
      })

      if (!res.ok) throw new Error('Failed to reject contract offer')
      await fetchPortalData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActioning(null)
    }
  }

  const handleReleasePlayer = async (player: Player) => {
    if (!confirm(`Are you sure you want to release ${player.name}? Their market value of ${player.value.toLocaleString()} CR will be refunded to your budget.`)) {
      return
    }

    setActioning(player.id)
    try {
      const res = await fetch('/api/franchise/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: player.id })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to release player')
      }

      await fetchPortalData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActioning(null)
    }
  }

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!biddingPlayer || !franchise) return

    const amount = parseInt(customBidAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive number.')
      return
    }

    if (franchise.budget < amount) {
      alert(`Insufficient credits! You cannot bid ${amount.toLocaleString()} CR. Your budget is ${franchise.budget.toLocaleString()} CR.`)
      return
    }

    setActioning(biddingPlayer.id)
    try {
      const res = await fetch('/api/franchise/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: biddingPlayer.id, bidAmount: amount })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit bid')
      }

      setBiddingPlayer(null)
      setCustomBidAmount('')
      await fetchPortalData()
      setTab('bids')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActioning(null)
    }
  }

  const handleRespondCounter = async (bidId: string, action: 'accept' | 'decline') => {
    const confirmationMsg = action === 'accept' 
      ? 'Are you sure you want to accept this counter proposal? Credits will be exchanged immediately.'
      : 'Are you sure you want to decline this counter proposal?'
    
    if (!confirm(confirmationMsg)) return

    setActioning(bidId)
    try {
      const res = await fetch('/api/franchise/bids/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId, action })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to respond to counter proposal')
      }

      await fetchPortalData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActioning(null)
    }
  }

  const handleRespondPendingBid = async (bidId: string, action: 'accept' | 'reject' | 'counter') => {
    if (action === 'accept') {
      if (!confirm('Are you sure you want to accept this transfer bid? Credits will be exchanged and the player will be transferred.')) {
        return
      }
    } else if (action === 'reject') {
      if (!confirm('Are you sure you want to reject this transfer bid?')) {
        return
      }
    }

    let counterAmount: number | undefined
    if (action === 'counter') {
      const amountStr = prompt('Enter your counter proposal amount (CR):')
      if (amountStr === null) return // Cancelled
      counterAmount = parseInt(amountStr)
      if (isNaN(counterAmount) || counterAmount <= 0) {
        alert('Please enter a valid positive number.')
        return
      }
    }

    setActioning(bidId)
    try {
      const res = await fetch('/api/franchise/bids/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId, action, counterAmount })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to respond to bid')
      }

      await fetchPortalData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActioning(null)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/franchise/logout', { method: 'POST' })
      router.push('/home')
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="text-center text-[#555] text-sm tracking-wider uppercase animate-pulse">
          Accessing Franchise Data...
        </div>
      </div>
    )
  }

  if (error || !franchise) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <div className="border border-[#ff4444] bg-[#ff4444]/10 text-[#ff4444] p-6 max-w-sm text-center">
          <p className="text-sm font-bold uppercase tracking-wider mb-4">Error loading portal</p>
          <p className="text-xs mb-6 text-gray-400">{error || 'Session invalid'}</p>
          <Link href="/franchise-login" className="bg-white text-black px-4 py-2 font-bold text-xs uppercase tracking-wider">
            Re-authenticate
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Top Banner Header */}
      <div className="relative border-b border-[#222] bg-[#050505] p-6 pt-12">
        <div className="flex items-center justify-between mb-6">
          <Link href="/home" className="text-[#888] hover:text-white transition-colors text-xs font-bold uppercase tracking-wider">
            ← Home
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={requestNotificationPermission}
              className="text-amber-400 hover:text-amber-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full transition-colors"
              title="Enable Phone & Push Notifications"
            >
              <span>🔔</span> Alerts
            </button>
            <button onClick={handleLogout} className="text-[#ff4444] text-xs font-bold uppercase tracking-wider active:opacity-60 ml-1">
              Sign Out
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full border border-[#333] bg-black flex items-center justify-center overflow-hidden shrink-0 shadow-xl">
            {franchise.logo_url ? (
              <img src={franchise.logo_url} alt={franchise.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-[#666] text-xl font-bold uppercase">{franchise.name.substring(0, 2)}</span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold">{franchise.name}</h1>
            <p className="text-[10px] text-[#555] uppercase tracking-widest mt-0.5">Franchise Owner Portal</p>
          </div>
        </div>

        {/* Budget Cards */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="bg-black border border-[#222] p-4">
            <p className="text-[9px] text-[#666] font-bold tracking-widest uppercase mb-1">Available Credits</p>
            <p className="text-white text-lg font-mono font-bold">
              {franchise.budget.toLocaleString()} <span className="text-xs text-[#555] font-sans font-normal">CR</span>
            </p>
          </div>
          <div className="bg-black border border-[#222] p-4">
            <p className="text-[9px] text-[#666] font-bold tracking-widest uppercase mb-1">Roster Size</p>
            <p className="text-white text-lg font-mono font-bold">
              {roster.length} <span className="text-xs text-[#555] font-sans font-normal">Players</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1a1a1a]">
        <button
          onClick={() => setTab('roster')}
          className={`flex-1 py-4 text-[10px] font-bold tracking-widest uppercase transition-colors
            ${tab === 'roster' ? 'text-white border-b-2 border-white bg-[#050505]' : 'text-[#555]'}`}
        >
          Our Roster ({roster.length})
        </button>
        <button
          onClick={() => setTab('market')}
          className={`flex-1 py-4 text-[10px] font-bold tracking-widest uppercase transition-colors
            ${tab === 'market' ? 'text-white border-b-2 border-white bg-[#050505]' : 'text-[#555]'}`}
        >
          Transfer Market
        </button>
        <button
          onClick={() => setTab('bids')}
          className={`flex-1 py-4 text-[10px] font-bold tracking-widest uppercase transition-colors
            ${tab === 'bids' ? 'text-white border-b-2 border-white bg-[#050505]' : 'text-[#555]'}`}
        >
          Bids ({outgoingBids.length + incomingBids.length})
        </button>
      </div>

      {/* Roster & Free Agent Content */}
      <div className="p-4">
        {tab === 'roster' && (
          roster.length === 0 ? (
            <div className="border border-[#222] bg-[#050505] p-12 text-center text-[#555]">
              <p className="text-sm uppercase tracking-wider mb-2">Roster is empty</p>
              <button onClick={() => setTab('market')} className="text-white text-xs underline font-bold mt-2 uppercase tracking-wide">
                Browse players to sign
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {roster.map(player => (
                <div key={player.id} className="border border-[#222] bg-[#0a0a0a] p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-[#333] bg-[#111] flex items-center justify-center shrink-0">
                      {player.photo_url ? (
                        <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover object-top" />
                      ) : (
                        <span className="text-[#444] text-sm font-bold uppercase">{player.name.substring(0, 2)}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">{player.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {player.position && (
                          <span className="text-[9px] font-bold text-[#888] border border-[#2a2a2a] px-1 py-0.5 uppercase">
                            {player.position}
                          </span>
                        )}
                        <span className="text-[10px] text-[#aaa] font-bold">
                          {player.value.toLocaleString()} CR
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={actioning !== null}
                    onClick={() => handleReleasePlayer(player)}
                    className="border border-[#ff4444] text-[#ff4444] bg-[#ff4444]/5 hover:bg-[#ff4444]/10 active:opacity-60 px-4 py-2 font-bold text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50"
                  >
                    {actioning === player.id ? '...' : 'Release'}
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'market' && (
          marketPlayers.length === 0 ? (
            <div className="border border-[#222] bg-[#050505] p-12 text-center text-[#555]">
              <p className="text-sm uppercase tracking-wider">No active players on the market</p>
            </div>
          ) : (
            <div className="space-y-3">
              {marketPlayers.map(player => {
                const isFreeAgent = player.available
                const canAfford = franchise.budget >= player.value
                const pendingOffer = contractOffers.find(o => o.player_id === player.id && ['pending', 'countered'].includes(o.status))
                const pendingBid = outgoingBids.find(b => b.player_id === player.id && ['pending', 'counter_proposed'].includes(b.status))
                
                return (
                  <div key={player.id} className="border border-[#222] bg-[#0a0a0a] p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden border border-[#333] bg-[#111] flex items-center justify-center shrink-0">
                        {player.photo_url ? (
                          <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover object-top" />
                        ) : (
                          <span className="text-[#444] text-sm font-bold uppercase">{player.name.substring(0, 2)}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">{player.name}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {player.position && (
                            <span className="text-[9px] font-bold text-[#888] border border-[#2a2a2a] px-1 py-0.5 uppercase">
                              {player.position}
                            </span>
                          )}
                          <span className="text-[10px] text-[#aaa] font-bold">
                            {player.value.toLocaleString()} CR
                          </span>
                          {!isFreeAgent && player.franchises && (
                            <span className="text-[9px] text-[#555] border border-[#111] px-1 py-0.5 uppercase">
                              Signed to {player.franchises.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {isFreeAgent ? (
                      pendingOffer ? (
                        <button disabled className="px-4 py-2 font-bold text-[10px] uppercase tracking-widest border border-amber-500/30 text-amber-500 bg-amber-500/5 cursor-not-allowed">
                          Offer Sent
                        </button>
                      ) : (
                        <button
                          disabled={actioning !== null}
                          onClick={() => handleSignPlayer(player)}
                          className={`px-4 py-2 font-bold text-[10px] uppercase tracking-widest transition-colors disabled:opacity-50
                            ${canAfford
                              ? 'bg-white text-black hover:bg-gray-200 active:opacity-60'
                              : 'border border-[#333] text-[#444] bg-[#050505] cursor-not-allowed'}`}
                        >
                          {actioning === player.id ? '...' : canAfford ? 'Sign' : 'Too Costly'}
                        </button>
                      )
                    ) : (
                      pendingBid ? (
                        <button disabled className="px-4 py-2 font-bold text-[10px] uppercase tracking-widest border border-[#4caf50]/30 text-[#4caf50] bg-[#4caf50]/5 cursor-not-allowed">
                          Bid Sent
                        </button>
                      ) : (
                        <button
                          disabled={actioning !== null}
                          onClick={() => setBiddingPlayer(player)}
                          className="border border-white text-white hover:bg-white hover:text-black transition-colors px-4 py-2 font-bold text-[10px] uppercase tracking-widest active:opacity-60"
                        >
                          Bid
                        </button>
                      )
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}

        {tab === 'bids' && (
          <div className="space-y-6">
            {/* Free Agent Wage Offers & Counter-Offers */}
            <div>
              <h2 className="text-xs text-[#555] font-bold tracking-widest uppercase mb-3">Free Agent Contract Proposals & Negotiations</h2>
              {contractOffers.length === 0 ? (
                <p className="text-xs text-[#444] border border-dashed border-[#222] p-4 text-center uppercase tracking-wider">No active Free Agent contract offers</p>
              ) : (
                <div className="space-y-3">
                  {contractOffers.map(offer => (
                    <div key={offer.id} className="border border-[#222] bg-[#0a0a0a] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{offer.player?.name}</span>
                          <span className="text-[10px] text-[#555] uppercase">(Free Agent)</span>
                        </div>
                        <span className={`text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 border
                          ${offer.status === 'accepted' && 'border-[#2a6b2a] text-[#4caf50] bg-[#0a1f0a]'}
                          ${offer.status === 'rejected' && 'border-[#6b2a2a] text-[#f44336] bg-[#1f0a0a]'}
                          ${offer.status === 'countered' && 'border-[#6b582a] text-[#ffb74d] bg-[#1f190a]'}
                          ${offer.status === 'pending' && 'border-[#333] text-[#888] bg-[#111]'}
                        `}>
                          {offer.status === 'countered' ? 'Player Countered' : offer.status}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[#555] block text-[8px] uppercase tracking-wider">Offered Daily Wage</span>
                          <span className="text-amber-400 font-mono font-bold">{offer.offered_wage.toLocaleString()} CR/day</span>
                        </div>
                        {offer.status === 'countered' && offer.proposed_by === 'player' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptCounterOffer(offer.id)}
                              disabled={actioning === offer.id}
                              className="bg-white text-black text-[10px] font-bold uppercase px-3 py-1.5 rounded"
                            >
                              Accept Counter Wage
                            </button>
                            <button
                              onClick={() => handleRejectContractOffer(offer.id)}
                              disabled={actioning === offer.id}
                              className="bg-[#1f0a0a] text-[#f44336] border border-[#6b2a2a] text-[10px] font-bold uppercase px-3 py-1.5 rounded"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing Bids section */}
            <div>
              <h2 className="text-xs text-[#555] font-bold tracking-widest uppercase mb-3">Bids Placed (Outgoing)</h2>
              {outgoingBids.length === 0 ? (
                <p className="text-xs text-[#444] border border-dashed border-[#222] p-4 text-center uppercase tracking-wider">No active outgoing bids</p>
              ) : (
                <div className="space-y-3">
                  {outgoingBids.map(bid => (
                    <div key={bid.id} className="border border-[#222] bg-[#0a0a0a] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{bid.player.name}</span>
                          <span className="text-[10px] text-[#555] uppercase">({bid.seller?.name || 'Free Agent'})</span>
                        </div>
                        <span className={`text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 border
                          ${bid.status === 'approved' && 'border-[#2a6b2a] text-[#4caf50] bg-[#0a1f0a]'}
                          ${bid.status === 'rejected' && 'border-[#6b2a2a] text-[#f44336] bg-[#1f0a0a]'}
                          ${bid.status === 'counter_proposed' && 'border-[#6b582a] text-[#ffb74d] bg-[#1f190a]'}
                          ${bid.status === 'pending' && 'border-[#333] text-[#888] bg-[#111]'}
                        `}>
                          {bid.status === 'counter_proposed' ? 'Counter Offered' : bid.status}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <div className="flex gap-4">
                          <div>
                            <span className="text-[#555] block text-[8px] uppercase tracking-wider">Your Offer</span>
                            <span className="text-white font-mono font-bold">{bid.bid_amount.toLocaleString()} CR</span>
                          </div>
                          {bid.counter_amount && (
                            <div>
                              <span className="text-[#ffb74d] block text-[8px] uppercase tracking-wider">Counter Proposed</span>
                              <span className="text-[#ffb74d] font-mono font-bold">{bid.counter_amount.toLocaleString()} CR</span>
                            </div>
                          )}
                        </div>

                        {bid.status === 'counter_proposed' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleRespondCounter(bid.id, 'accept')}
                              className="bg-[#ffb74d] text-black font-bold uppercase tracking-widest text-[9px] px-3 py-1.5 active:opacity-60 transition-opacity animate-pulse"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRespondCounter(bid.id, 'decline')}
                              className="border border-[#ff4444] text-[#ff4444] font-bold uppercase tracking-widest text-[9px] px-3 py-1.5 active:opacity-60 transition-opacity"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Incoming Bids section */}
            <div>
              <h2 className="text-xs text-[#555] font-bold tracking-widest uppercase mb-3">Roster Bids (Incoming)</h2>
              {incomingBids.length === 0 ? (
                <p className="text-xs text-[#444] border border-dashed border-[#222] p-4 text-center uppercase tracking-wider">No active bids on your roster</p>
              ) : (
                <div className="space-y-3">
                  {incomingBids.map(bid => (
                    <div key={bid.id} className="border border-[#222] bg-[#0a0a0a] p-4 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{bid.player.name}</span>
                            <span className="text-[10px] text-[#555] uppercase">by {bid.bidder.name}</span>
                          </div>
                          <div className="mt-1 text-xs">
                            <span className="text-[#555] mr-1">Bid Offer:</span>
                            <span className="text-white font-mono font-bold">{bid.bid_amount.toLocaleString()} CR</span>
                          </div>
                          {bid.counter_amount && (
                            <div className="mt-0.5 text-xs">
                              <span className="text-[#ffb74d] mr-1">Counter Proposed:</span>
                              <span className="text-[#ffb74d] font-mono font-bold">{bid.counter_amount.toLocaleString()} CR</span>
                            </div>
                          )}
                        </div>
                        <span className={`text-[9px] font-bold tracking-widest uppercase px-2 py-1 border
                          ${bid.status === 'approved' && 'border-[#2a6b2a] text-[#4caf50] bg-[#0a1f0a]'}
                          ${bid.status === 'rejected' && 'border-[#6b2a2a] text-[#f44336] bg-[#1f0a0a]'}
                          ${bid.status === 'counter_proposed' && 'border-[#6b582a] text-[#ffb74d] bg-[#1f190a]'}
                          ${bid.status === 'pending' && 'border-[#333] text-[#888] bg-[#111]'}
                        `}>
                          {bid.status === 'counter_proposed' ? 'Counter Proposed' : bid.status}
                        </span>
                      </div>

                      {bid.status === 'pending' && (
                        <div className="flex items-center gap-2 pt-2 border-t border-[#111]">
                          <button
                            disabled={actioning !== null}
                            onClick={() => handleRespondPendingBid(bid.id, 'accept')}
                            className="flex-1 bg-white text-black text-[10px] font-bold uppercase tracking-widest py-2 hover:bg-gray-200 active:opacity-60 transition-colors disabled:opacity-50"
                          >
                            Accept
                          </button>
                          <button
                            disabled={actioning !== null}
                            onClick={() => handleRespondPendingBid(bid.id, 'counter')}
                            className="flex-1 border border-[#333] text-white text-[10px] font-bold uppercase tracking-widest py-2 hover:bg-[#111] active:opacity-60 transition-colors disabled:opacity-50"
                          >
                            Counter
                          </button>
                          <button
                            disabled={actioning !== null}
                            onClick={() => handleRespondPendingBid(bid.id, 'reject')}
                            className="flex-1 border border-[#ff4444]/20 text-[#ff4444] text-[10px] font-bold uppercase tracking-widest py-2 hover:bg-[#ff4444]/5 active:opacity-60 transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bid Modal Overlay */}
      {biddingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-[#222] p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold uppercase tracking-wide mb-2 text-white">Place Transfer Bid</h2>
            <p className="text-xs text-[#666] mb-6">
              You are placing a bid on **{biddingPlayer.name}** (Valued at {biddingPlayer.value.toLocaleString()} CR). If the BD approves or counter-proposes, credits will exchange on agreement.
            </p>

            <form onSubmit={handlePlaceBid} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-[#555]">
                  Bid Offer (Credits)
                </label>
                <input
                  type="number"
                  required
                  value={customBidAmount}
                  onChange={e => setCustomBidAmount(e.target.value)}
                  placeholder={`e.g. ${biddingPlayer.value}`}
                  className="w-full bg-[#111] border border-[#333] p-4 text-white focus:outline-none focus:border-white transition-colors text-base font-bold font-mono"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={actioning !== null}
                  className="flex-1 bg-white text-black font-bold tracking-widest uppercase p-4 hover:bg-gray-200 transition-colors disabled:opacity-50 text-xs"
                >
                  Submit Offer
                </button>
                <button
                  type="button"
                  onClick={() => { setBiddingPlayer(null); setCustomBidAmount(''); }}
                  className="flex-1 border border-[#333] text-white font-bold tracking-widest uppercase p-4 hover:bg-[#111] transition-colors text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
