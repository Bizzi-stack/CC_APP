'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PublicNav from '@/components/PublicNav'
import VerificationBadge from '@/components/VerificationBadge'
import ProfileBanner, { BusinessBadge, InstagramBadge, SpotifyPlayer, FranchiseOwnerBadge } from '@/components/ProfileBanner'
import { getCountryFlag } from '@/lib/countries'
import FranchiseStockChart from '@/components/FranchiseStockChart'
import FranchiseRosterModal from '@/components/FranchiseRosterModal'
import { TopScorerBadge, TopAssisterBadge } from '@/components/TopBadges'
import PullDownModal from '@/components/PullDownModal'
import FooterPartnerTicker from '@/components/FooterPartnerTicker'
import { retroAudio } from '@/lib/sounds'

interface Player {
  id: string
  name: string
  position?: string
  photo_url?: string
  available: boolean
  notes?: string
  value?: number
  goals?: number
  assists?: number
  country?: string | null
  status: string
  franchise_id?: string
  verification_badge?: string | null
  banner_url?: string | null
  instagram_url?: string | null
  spotify_track_url?: string | null
  is_business?: boolean | null
  business_name?: string | null
  is_franchise_owner?: boolean | null
  owned_franchise_id?: string | null
  owned_franchise?: {
    id: string
    name: string
    logo_url: string | null
  } | null
  is_top_scorer?: boolean
  is_top_assister?: boolean
  franchises?: {
    id: string
    name: string
    logo_url: string | null
  } | null
  badges?: string[]
  canvas_badge_ids?: string[]
  canvas_badges_data?: { id: string, x: number, y: number, width?: number, height?: number }[]
}

interface CanvasBadge {
  id: string
  name: string
  image_url: string
}

type Filter = 'all' | 'available' | 'unavailable' | 'overseas'

export default function MarketPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [canvasBadges, setCanvasBadges] = useState<CanvasBadge[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [viewRosterFranchise, setViewRosterFranchise] = useState<{ id?: string, name?: string } | null>(null)
  
  // Stocks state
  const [stockFranchises, setStockFranchises] = useState<any[]>([])
  const [stockListings, setStockListings] = useState<any[]>([])
  const [userPortfolio, setUserPortfolio] = useState<any[]>([])
  const [buyingShare, setBuyingShare] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/players?status=active'),
      fetch('/api/canvas-badges'),
      fetch('/api/franchise/shares'),
      fetch('/api/player/me')
    ])
      .then(async ([resPlayers, resBadges, resShares, resMe]) => {
        if (!resPlayers.ok) throw new Error('Failed to fetch')
        const data = await resPlayers.json()
        const badgeData = await resBadges.json()
        const sharesData = await resShares.json()
        const meData = await resMe.json().catch(() => ({}))

        setPlayers(data.players || [])
        setCanvasBadges(badgeData.badges || [])
        setStockFranchises(sharesData.franchises || [])
        setStockListings(sharesData.listings || [])
        setUserPortfolio(sharesData.userPortfolio || [])
        if (meData?.player) setCurrentUser(meData.player)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const fetchStockShares = async () => {
    try {
      const sharesRes = await fetch('/api/franchise/shares')
      const sharesData = await sharesRes.json()
      setStockFranchises(sharesData.franchises || [])
      setStockListings(sharesData.listings || [])
      setUserPortfolio(sharesData.userPortfolio || [])
    } catch {}
  }

  const handleBuyShare = async (listingId: string) => {
    setBuyingShare(listingId)
    try {
      const res = await fetch('/api/franchise/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'buy', listing_id: listingId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to buy shares')
      alert(data.message || 'Share purchase successful!')
      await fetchStockShares()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setBuyingShare(null)
    }
  }

  const isPlayerAvailable = (p: Player) => {
    return !p.franchise_id && p.available !== false && p.status !== 'overseas'
  }

  const filtered = players.filter(p => {
    if (filter === 'available') return isPlayerAvailable(p)
    if (filter === 'unavailable') return !isPlayerAvailable(p) && p.status !== 'overseas'
    if (filter === 'overseas') return p.status === 'overseas'
    return true
  })

  const availableCount = players.filter(isPlayerAvailable).length
  const overseasCount = players.filter(p => p.status === 'overseas').length
  const signedCount = players.filter(p => !isPlayerAvailable(p) && p.status !== 'overseas').length

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex flex-col items-center pt-12 pb-5 border-b border-[#1a1a1a] px-4">
        <Link href="/home" className="flex items-center gap-2 mb-3">
          <img src="/logo.png" alt="College Clubs" className="h-16 object-contain brightness-0 invert" />
          <span className="text-xl font-black uppercase tracking-wider text-white">College Clubs</span>
        </Link>
        <h1 className="text-sm font-bold tracking-[0.2em] uppercase text-[#aaa]">Tournament Players</h1>
        <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
          <span className="text-[10px] font-bold tracking-widest text-[#555] uppercase">
            {availableCount} Available
          </span>
          <span className="text-[#333]">·</span>
          <span className="text-[10px] font-bold tracking-widest text-[#555] uppercase">
            {signedCount} Signed
          </span>
          <span className="text-[#333]">·</span>
          <span className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">
            {overseasCount} Overseas
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-[#1a1a1a]">
        {(['all', 'available', 'unavailable', 'overseas'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-3 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase transition-colors
              ${filter === f ? 'text-white border-b-2 border-white' : 'text-[#555]'}`}
          >
            {f === 'all' ? 'All' : f === 'available' ? 'Available' : f === 'unavailable' ? 'Signed' : 'Overseas'}
          </button>
        ))}
      </div>

      {/* Player Content List */}
      <div className="pb-24">
        {loading ? (
          <div className="divide-y divide-[#111]">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-4 px-4 py-4 animate-pulse">
                <div className="w-14 h-14 rounded-full bg-[#1a1a1a] flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 bg-[#1a1a1a] rounded" />
                  <div className="h-3 w-20 bg-[#1a1a1a] rounded" />
                  <div className="h-3 w-24 bg-[#1a1a1a] rounded" />
                </div>
                <div className="w-14 h-8 bg-[#1a1a1a] rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <p className="text-[#555] text-sm">No players found</p>
            <a href="/join" className="mt-3 text-white text-sm underline">Join the market →</a>
          </div>
        ) : (
          <div className="divide-y divide-[#111]">
            {filtered.map(player => (
              <div 
                key={player.id} 
                onClick={() => {
                  retroAudio.playClick()
                  setSelectedPlayer(player)
                }} 
                className="cursor-pointer hover:bg-[#0a0a0a] transition-colors"
              >
                <PublicPlayerRow player={player} />
              </div>
            ))}
          </div>
        )}
      </div>

      <FooterPartnerTicker />

      {/* Public Navigation */}
      <PublicNav />

      {/* Profile Popup */}
      <PullDownModal
        isOpen={Boolean(selectedPlayer)}
        onClose={() => setSelectedPlayer(null)}
      >
        {selectedPlayer && (
          <div>
            <div className="flex gap-4">
              {/* Big Photo */}
              <div className="w-24 h-24 flex-shrink-0 rounded-2xl overflow-hidden border border-[#222] bg-[#111] flex items-center justify-center shadow-2xl">
                {selectedPlayer.photo_url ? (
                  <img src={selectedPlayer.photo_url} alt={selectedPlayer.name} className="w-full h-full object-cover object-top" />
                ) : (
                  <span className="text-3xl font-bold text-[#444]">
                    {selectedPlayer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 pt-1">
                <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-1.5 flex-wrap">
                  <span>{selectedPlayer.name}</span>
                  <VerificationBadge type={selectedPlayer.verification_badge} className="w-[28px] h-[28px] ml-0.5" />
                  {selectedPlayer.is_top_scorer && <TopScorerBadge className="w-7 h-7" />}
                  {selectedPlayer.is_top_assister && <TopAssisterBadge className="w-7 h-7" />}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <FranchiseOwnerBadge isOwner={selectedPlayer.is_franchise_owner} franchiseName={selectedPlayer.owned_franchise?.name} />
                  <InstagramBadge url={selectedPlayer.instagram_url} />
                  {selectedPlayer.franchises && (
                    <button
                      type="button"
                      onClick={() => setViewRosterFranchise({ id: selectedPlayer.franchise_id, name: selectedPlayer.franchises?.name })}
                      className="flex items-center gap-1.5 bg-[#111] border border-[#333] hover:border-amber-500/50 px-2 py-1 transition-colors group cursor-pointer"
                      title={`View ${selectedPlayer.franchises.name} Roster`}
                    >
                      {selectedPlayer.franchises.logo_url ? (
                        <img src={selectedPlayer.franchises.logo_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-[#888]">{selectedPlayer.franchises.name.substring(0, 1)}</span>
                      )}
                      <span className="text-[11px] font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1">
                        <span>{selectedPlayer.franchises.name}</span>
                        <span className="text-[9px] text-amber-400 font-mono">👥</span>
                      </span>
                    </button>
                  )}
                  {selectedPlayer.position && (
                    <span className="text-[11px] font-bold text-[#888] border border-[#2a2a2a] px-2 py-1">
                      {selectedPlayer.position}
                    </span>
                  )}
                </div>

                <div className={`inline-block text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 border
                  ${selectedPlayer.available
                    ? 'border-[#2a6b2a] text-[#4caf50] bg-[#0a1f0a]'
                    : 'border-[#333] text-[#888] bg-[#111]'
                  }`}>
                  {selectedPlayer.available ? 'AVAILABLE' : 'SIGNED'}
                </div>
              </div>
            </div>

            {/* Embedded Spotify Player if track provided */}
            {selectedPlayer.spotify_track_url && (
              <div className="mt-4">
                <SpotifyPlayer url={selectedPlayer.spotify_track_url} />
              </div>
            )}

            {/* IMVU Style Canvas */}
            {((selectedPlayer.canvas_badges_data?.length || 0) > 0 || (selectedPlayer.canvas_badge_ids?.length || 0) > 0) && (
              <div className="mt-8 border border-[#222] bg-[#0d0d0d] rounded-xl overflow-hidden relative">
                {/* Subtle grid background pattern */}
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)', backgroundSize: '5% 20%', backgroundPosition: 'left top' }} />
                
                <div className="relative w-full h-48">
                  {/* Render positioned badges */}
                  {selectedPlayer.canvas_badges_data?.map(pos => {
                    const badge = canvasBadges.find(b => b.id === pos.id)
                    if (!badge) return null
                    return (
                      <div 
                        key={pos.id} 
                        className="absolute z-10" 
                        style={{ 
                          left: `${pos.x}%`, 
                          top: `${pos.y}%`, 
                          width: `${pos.width || 10}%`, 
                          height: `${pos.height || 40}%`
                        }}
                      >
                        <div className="flex items-center justify-center hover:scale-110 transition-transform w-full h-full" title={badge.name}>
                          <img src={badge.image_url} alt={badge.name} className="w-full h-full object-cover filter drop-shadow-lg" />
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Fallback for legacy un-positioned badges */}
                  {(!selectedPlayer.canvas_badges_data || selectedPlayer.canvas_badges_data.length === 0) && selectedPlayer.canvas_badge_ids?.map((badgeId, index) => {
                    const badge = canvasBadges.find(b => b.id === badgeId)
                    if (!badge) return null
                    return (
                      <div 
                        key={badge.id} 
                        className="absolute z-10" 
                        style={{ left: `${20 + (index * 20)}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
                      >
                        <div className="flex items-center justify-center hover:scale-110 transition-transform" title={badge.name}>
                          <img src={badge.image_url} alt={badge.name} className="max-w-[80px] max-h-[80px] sm:max-w-[100px] sm:max-h-[100px] object-contain filter drop-shadow-lg" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* View Stats Button */}
            <div className="mt-8 mb-4">
              <Link 
                href={`/player/${selectedPlayer.id}`}
                className="block w-full text-center bg-white text-black font-bold tracking-widest uppercase py-4 rounded-xl hover:bg-gray-200 transition-colors shadow-lg"
              >
                View Player Stats
              </Link>
            </div>
          </div>
        )}
      </PullDownModal>

      {/* Franchise Roster Modal */}
      {viewRosterFranchise && (
        <FranchiseRosterModal
          franchiseId={viewRosterFranchise.id}
          franchiseName={viewRosterFranchise.name}
          onClose={() => setViewRosterFranchise(null)}
          onSelectPlayer={(p: any) => {
            setViewRosterFranchise(null)
            setSelectedPlayer(p)
          }}
        />
      )}

      <PublicNav />
    </div>
  )
}

function PublicPlayerRow({ player }: { player: Player }) {
  const initials = player.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="flex items-center gap-4 px-4 py-4">
      {/* Photo */}
      <div className="w-14 h-14 flex-shrink-0 rounded-full overflow-hidden border border-[#222] bg-[#111] flex items-center justify-center">
        {player.photo_url ? (
          <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover object-top" />
        ) : (
          <span className="text-base font-bold text-[#444]">{initials}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm flex items-center gap-1.5 min-w-0">
          <span className="truncate">{player.name}</span>
          <VerificationBadge type={player.verification_badge} className="w-[20px] h-[20px] ml-0.5" />
          {player.is_top_scorer && <TopScorerBadge className="w-5 h-5" />}
          {player.is_top_assister && <TopAssisterBadge className="w-5 h-5" />}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          <span className="text-[10px] font-bold text-white border border-[#2a2a2a] bg-black px-1.5 py-0.5 flex items-center gap-1">
            <span>{getCountryFlag(player.country)}</span>
            <span>{player.country || 'Barbados'}</span>
          </span>
          <FranchiseOwnerBadge isOwner={player.is_franchise_owner} franchiseName={player.owned_franchise?.name} compact={true} />
          <InstagramBadge url={player.instagram_url} />
          {player.franchises && (
            <div className="flex items-center gap-1.5 bg-[#111] border border-[#333] px-1.5 py-0.5" title={player.franchises.name}>
              {player.franchises.logo_url ? (
                <img src={player.franchises.logo_url} alt="" className="w-3 h-3 rounded-full object-cover" />
              ) : (
                <span className="text-[8px] font-bold text-[#888]">{player.franchises.name.substring(0, 1)}</span>
              )}
              <span className="text-[10px] font-bold text-white max-w-[80px] truncate">{player.franchises.name}</span>
            </div>
          )}
          {player.position && (
            <span className="text-[10px] font-bold text-[#888] border border-[#2a2a2a] px-1.5 py-0.5">
              {player.position}
            </span>
          )}
        </div>
      </div>

      {/* Status Badge or Signed Club Logo */}
      {player.status === 'overseas' ? (
        <div className="flex-shrink-0 text-[10px] font-extrabold tracking-widest uppercase px-3 py-1.5 border border-blue-500/50 text-blue-400 bg-blue-950/40 rounded-none shadow-sm">
          OVERSEAS
        </div>
      ) : player.available ? (
        <div className="flex-shrink-0 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 border border-[#2a6b2a] text-[#4caf50] bg-[#0a1f0a] rounded-none">
          AVAILABLE
        </div>
      ) : (
        <div className="flex-shrink-0 flex items-center justify-center">
          {player.franchises?.logo_url ? (
            <div className="w-9 h-9 bg-[#111] border border-[#333] p-1 flex items-center justify-center shadow-md overflow-hidden rounded-none" title={`Signed to ${player.franchises.name}`}>
              <img src={player.franchises.logo_url} alt={player.franchises.name} className="w-full h-full object-contain" />
            </div>
          ) : player.franchises?.name ? (
            <div className="px-2.5 py-1.5 bg-[#111] border border-[#333] text-[9px] font-black text-white uppercase tracking-wider rounded-none" title={`Signed to ${player.franchises.name}`}>
              {player.franchises.name}
            </div>
          ) : (
            <div className="text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 border border-[#333] text-[#888] bg-[#111] rounded-none">
              SIGNED
            </div>
          )}
        </div>
      )}
    </div>
  )
}
