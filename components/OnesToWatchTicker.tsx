'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { getCountryFlag } from '@/lib/countries'

interface Player {
  id: string
  name: string
  photo_url?: string | null
  position?: string | null
  country?: string | null
  franchises?: {
    id: string
    name: string
    logo_url: string | null
  } | null
  goals?: number
  assists?: number
  value?: number
  status?: string
}

export default function OnesToWatchTicker() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [cornerStyle, setCornerStyle] = useState<'rounded' | 'pointed'>('rounded')
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  useEffect(() => {
    fetch('/api/players')
      .then(res => res.json())
      .then(data => {
        const all: Player[] = data.players || []
        // Prioritize players with uploaded photos
        const withPhotos = all.filter(p => p.photo_url && p.photo_url.trim() !== '')
        // Take an exciting curated set of players across different teams
        const displayPool = withPhotos.length > 0 ? withPhotos : all
        setPlayers(displayPool)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Duplicate for infinite seamless marquee loop
  const loopedPlayers = useMemo(() => {
    if (players.length === 0) return []
    // Ensure we have enough items for smooth continuous loop
    if (players.length < 10) {
      return [...players, ...players, ...players, ...players]
    }
    return [...players, ...players]
  }, [players])

  if (loading) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 bg-[#1a1a1a] rounded animate-pulse" />
          <div className="h-3 w-20 bg-[#1a1a1a] rounded animate-pulse" />
        </div>
        <div className="flex gap-3 overflow-hidden py-1">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-44 h-44 bg-[#111] rounded-2xl border border-[#222] animate-pulse shrink-0" />
          ))}
        </div>
      </section>
    )
  }

  if (players.length === 0) {
    return null
  }

  const radiusClass = cornerStyle === 'rounded' ? 'rounded-2xl' : 'rounded-none'

  return (
    <section className="space-y-3 select-none">
      {/* Header with Title and Corner Radius Style Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <h2 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-1.5">
            <span>ONES TO WATCH</span>
            <span className="bg-amber-400/10 text-amber-400 border border-amber-500/30 text-[9px] px-1.5 py-0.5 rounded font-bold">
              OTW
            </span>
          </h2>
        </div>

        {/* Interactive Style Switcher (Rounded Radius vs Pointed Sharp) */}
        <div className="flex items-center gap-1 bg-[#111] border border-[#222] p-0.5 rounded-lg text-[9px] font-bold uppercase">
          <button
            type="button"
            onClick={() => setCornerStyle('rounded')}
            className={`px-2 py-1 rounded transition-colors ${
              cornerStyle === 'rounded'
                ? 'bg-amber-400 text-black shadow'
                : 'text-[#888] hover:text-white'
            }`}
            title="Rounded Corner Radius"
          >
            Rounded
          </button>
          <button
            type="button"
            onClick={() => setCornerStyle('pointed')}
            className={`px-2 py-1 rounded transition-colors ${
              cornerStyle === 'pointed'
                ? 'bg-amber-400 text-black shadow'
                : 'text-[#888] hover:text-white'
            }`}
            title="Sharp Pointed Corners"
          >
            Pointed
          </button>
        </div>
      </div>

      {/* Infinite Stock Ticker Carousel (Moving Left) */}
      <div
        className="w-full relative overflow-hidden py-1 group"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 4%, black 96%, transparent)'
        }}
      >
        <div className="flex w-max animate-ticker items-center gap-3 sm:gap-4 group-hover:[animation-play-state:paused]">
          {loopedPlayers.map((player, idx) => {
            const teamName = player.franchises?.name || player.country || 'Free Agent'
            const flag = getCountryFlag(player.country || teamName)
            const photoUrl = player.photo_url || '/placeholder-avatar.png'

            return (
              <div
                key={`${player.id}-${idx}`}
                onClick={() => setSelectedPlayer(player)}
                className={`w-44 h-44 sm:w-52 sm:h-52 ${radiusClass} overflow-hidden border border-[#222] hover:border-amber-400/80 bg-[#0c0c0c] relative group/card cursor-pointer shrink-0 transition-all duration-300 hover:scale-[1.02] shadow-xl`}
              >
                {/* Full-bleed Player Photo */}
                <img
                  src={photoUrl}
                  alt={player.name}
                  loading="lazy"
                  className="w-full h-full object-cover object-top group-hover/card:scale-110 transition-transform duration-500 ease-out"
                />

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent pointer-events-none" />

                {/* Top Left: Nation / Franchise Badge */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 text-[9px] font-bold text-white shadow">
                  <span>{flag}</span>
                  <span className="truncate max-w-[80px]">{teamName}</span>
                </div>

                {/* Top Right: Position Tag */}
                {player.position && (
                  <div className="absolute top-2.5 right-2.5 bg-amber-400 text-black font-black text-[9px] uppercase px-2 py-0.5 rounded shadow">
                    {player.position}
                  </div>
                )}

                {/* Bottom Card Typography */}
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[8px] font-mono uppercase tracking-widest text-amber-400 font-extrabold">
                      FEATURED TALENT
                    </span>
                  </div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wide truncate drop-shadow-lg">
                    {player.name}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] text-[#aaa] mt-0.5">
                    <span className="truncate">{teamName}</span>
                    <span className="text-amber-400 text-[10px] font-bold opacity-0 group-hover/card:opacity-100 transition-opacity">
                      View →
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Marquee Animation Styles */}
      <style jsx>{`
        @keyframes tickerSlow {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-ticker {
          animation: tickerSlow 35s linear infinite;
        }
      `}</style>

      {/* Quick Player Inspection Modal */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPlayer(null)}
        >
          <div
            className="bg-[#0e0e0e] border border-[#333] w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {getCountryFlag(selectedPlayer.country || selectedPlayer.franchises?.name)}
                </span>
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                    {selectedPlayer.franchises?.name || selectedPlayer.country || 'Free Agent'}
                  </span>
                  <h3 className="text-base font-black uppercase text-white">
                    {selectedPlayer.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="w-7 h-7 rounded-full bg-[#222] hover:bg-[#333] text-[#aaa] hover:text-white flex items-center justify-center text-xs transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Photo Preview in Modal */}
            <div className="relative w-full h-56 rounded-xl overflow-hidden bg-black border border-[#222]">
              <img
                src={selectedPlayer.photo_url || '/placeholder-avatar.png'}
                alt={selectedPlayer.name}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute top-2.5 right-2.5 bg-amber-400 text-black font-black text-xs uppercase px-2.5 py-1 rounded shadow">
                {selectedPlayer.position || 'Player'}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#161616] p-2.5 rounded-xl border border-[#222]">
                <span className="text-[9px] text-[#777] font-bold uppercase block">Position</span>
                <span className="text-xs font-black text-white">{selectedPlayer.position || 'N/A'}</span>
              </div>
              <div className="bg-[#161616] p-2.5 rounded-xl border border-[#222]">
                <span className="text-[9px] text-[#777] font-bold uppercase block">Goals</span>
                <span className="text-xs font-black text-emerald-400">{selectedPlayer.goals || 0}</span>
              </div>
              <div className="bg-[#161616] p-2.5 rounded-xl border border-[#222]">
                <span className="text-[9px] text-[#777] font-bold uppercase block">Assists</span>
                <span className="text-xs font-black text-amber-400">{selectedPlayer.assists || 0}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <Link
                href={`/player/${selectedPlayer.id}`}
                className="flex-1 bg-white text-black text-center py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-[#eee] transition-colors"
              >
                View Full Profile
              </Link>
              <Link
                href="/fantasy"
                className="flex-1 bg-gradient-to-r from-amber-400 to-amber-500 text-black text-center py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:brightness-110 transition-all"
              >
                Pick in Fantasy
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
