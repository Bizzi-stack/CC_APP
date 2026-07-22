'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PublicNav from '@/components/PublicNav'
import VerificationBadge from '@/components/VerificationBadge'
import ProfileBanner, { BusinessBadge, InstagramBadge, SpotifyPlayer, FranchiseOwnerBadge } from '@/components/ProfileBanner'

interface Player {
  id: string
  name: string
  position?: string
  photo_url?: string
  available: boolean
  notes?: string
  value?: number
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

type Filter = 'all' | 'available' | 'unavailable'

export default function MarketPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [canvasBadges, setCanvasBadges] = useState<CanvasBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/players?status=active').then(r => r.json()),
      fetch('/api/canvas-badges').then(r => r.json())
    ]).then(([playersData, badgesData]) => {
      setPlayers(playersData.players || [])
      setCanvasBadges(badgesData.badges || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const filtered = players.filter(p => {
    if (filter === 'available') return p.available
    if (filter === 'unavailable') return !p.available
    return true
  })

  const availableCount = players.filter(p => p.available).length

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex flex-col items-center pt-12 pb-5 border-b border-[#1a1a1a] px-4">
        <Link href="/home">
          <img src="/logo_2.png" alt="The Circle FC" className="h-16 object-contain brightness-0 invert mb-3" />
        </Link>
        <h1 className="text-sm font-bold tracking-[0.2em] uppercase text-[#aaa]">Transfer Market</h1>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-[10px] font-bold tracking-widest text-[#555] uppercase">
            {availableCount} Available
          </span>
          <span className="text-[#333]">·</span>
          <span className="text-[10px] font-bold tracking-widest text-[#555] uppercase">
            {players.length - availableCount} Signed
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-[#1a1a1a]">
        {(['all', 'available', 'unavailable'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-3 text-[11px] font-bold tracking-widest uppercase transition-colors
              ${filter === f ? 'text-white border-b-2 border-white' : 'text-[#555]'}`}
          >
            {f === 'all' ? 'All' : f === 'available' ? 'Available' : 'Signed'}
          </button>
        ))}
      </div>

      {/* Player List */}
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
              <div key={player.id} onClick={() => setSelectedPlayer(player)} className="cursor-pointer hover:bg-[#0a0a0a] transition-colors">
                <PublicPlayerRow player={player} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Public Navigation */}
      <PublicNav />

      {/* Profile Popup */}
      {selectedPlayer && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col justify-end"
          onClick={() => setSelectedPlayer(null)}
        >
          <div 
            className="w-full max-w-[430px] mx-auto bg-[#0a0a0a] border-t border-[#222] rounded-t-3xl p-6 pb-12 animate-slide-up relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Close handle */}
            <div className="w-12 h-1.5 bg-[#333] rounded-full mx-auto mb-6" />

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
                <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-1 flex-wrap">
                  <span>{selectedPlayer.name}</span>
                  <VerificationBadge type={selectedPlayer.verification_badge} className="w-[28px] h-[28px] ml-0.5" />
                </h2>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <FranchiseOwnerBadge isOwner={selectedPlayer.is_franchise_owner} franchiseName={selectedPlayer.owned_franchise?.name} />
                  <BusinessBadge isBusiness={selectedPlayer.is_business} businessName={selectedPlayer.business_name} />
                  <InstagramBadge url={selectedPlayer.instagram_url} />
                  {selectedPlayer.franchises && (
                    <div className="flex items-center gap-1.5 bg-[#111] border border-[#333] px-2 py-1" title={selectedPlayer.franchises.name}>
                      {selectedPlayer.franchises.logo_url ? (
                        <img src={selectedPlayer.franchises.logo_url} alt="" className="w-4 h-4 rounded-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-[#888]">{selectedPlayer.franchises.name.substring(0, 1)}</span>
                      )}
                      <span className="text-[11px] font-bold text-white">{selectedPlayer.franchises.name}</span>
                    </div>
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

            {/* Value & Text Badges */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {selectedPlayer.value !== undefined && selectedPlayer.value > 0 && (
                <div className="border border-[#222] bg-[#111] px-4 py-2">
                  <p className="text-[9px] text-[#666] font-bold tracking-widest uppercase mb-0.5">Market Value</p>
                  <p className="text-white text-base font-bold">
                    {selectedPlayer.value.toLocaleString()} <span className="text-[#555] font-normal text-sm">CR</span>
                  </p>
                </div>
              )}

              {selectedPlayer.badges && selectedPlayer.badges.map(badge => (
                <span key={badge} className="text-xs font-bold text-white border border-[#555] px-3 py-2">
                  {badge}
                </span>
              ))}
            </div>

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
          </div>
        </div>
      )}
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
        <p className="text-white font-semibold text-sm flex items-center min-w-0">
          <span className="truncate">{player.name}</span>
          <VerificationBadge type={player.verification_badge} className="w-[20px] h-[20px] ml-0.5" />
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          <FranchiseOwnerBadge isOwner={player.is_franchise_owner} franchiseName={player.owned_franchise?.name} />
          <BusinessBadge isBusiness={player.is_business} businessName={player.business_name} />
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
          {player.badges && player.badges.map(badge => (
            <span key={badge} className="text-[10px] font-bold text-white border border-[#555] px-1.5 py-0.5">
              {badge}
            </span>
          ))}
        </div>
        {player.value !== undefined && player.value > 0 && (
          <p className="text-[#aaa] text-xs font-bold mt-1">
            {player.value.toLocaleString()} <span className="text-[#555] font-normal">CR</span>
          </p>
        )}
      </div>

      {/* Status Badge */}
      <div className={`flex-shrink-0 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 border
        ${player.available
          ? 'border-[#2a6b2a] text-[#4caf50] bg-[#0a1f0a]'
          : 'border-[#333] text-[#888] bg-[#111]'
        }`}>
        {player.available ? 'AVAILABLE' : 'SIGNED'}
      </div>
    </div>
  )
}
