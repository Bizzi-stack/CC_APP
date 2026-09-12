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
  badges?: string[] | null
  goals?: number
  assists?: number
  value?: number
  status?: string
}

export default function OnesToWatchTicker() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  useEffect(() => {
    fetch('/api/players')
      .then(res => res.json())
      .then(data => {
        const all: Player[] = data.players || []
        
        // 1. Check for explicitly tagged 'OTW' players
        const otwExplicit = all.filter(p => Array.isArray(p.badges) && p.badges.includes('OTW'))
        
        // 2. Filter other players who have uploaded photos
        const othersWithPhotos = all.filter(
          p => (!Array.isArray(p.badges) || !p.badges.includes('OTW')) && p.photo_url && p.photo_url.trim() !== ''
        )

        let displayPool: Player[]
        if (otwExplicit.length > 0) {
          // If admin has featured players, feature them prominently!
          // Supplement with other photo players if under 12 so the marquee remains richly populated
          displayPool = otwExplicit.length >= 10
            ? otwExplicit
            : [...otwExplicit, ...othersWithPhotos.slice(0, 16 - otwExplicit.length)]
        } else {
          // Default pool: players with uploaded photos
          displayPool = othersWithPhotos.length > 0 ? othersWithPhotos : all
        }

        setPlayers(displayPool)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Duplicate for seamless infinite marquee loop
  const loopedPlayers = useMemo(() => {
    if (players.length === 0) return []
    // Ensure sufficient items for seamless continuous gliding
    if (players.length < 8) {
      return [...players, ...players, ...players, ...players]
    }
    return [...players, ...players]
  }, [players])

  // Compute a relaxed, readable marquee duration (~4.5s per item, min 90s, max 160s)
  const animationDurationSeconds = useMemo(() => {
    const calculated = loopedPlayers.length * 4.5
    return Math.max(90, Math.min(160, calculated))
  }, [loopedPlayers.length])

  if (loading) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 bg-[#1a1a1a] animate-pulse" />
          <div className="h-3 w-20 bg-[#1a1a1a] animate-pulse" />
        </div>
        <div className="flex gap-3 overflow-hidden py-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-48 h-48 bg-[#0c0c0c] border border-[#222] animate-pulse shrink-0" />
          ))}
        </div>
      </section>
    )
  }

  if (players.length === 0) {
    return null
  }

  return (
    <section className="space-y-3 select-none">
      {/* Header with Title and Edgy Subtitle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-amber-400 animate-pulse" />
          <h2 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
            <span>ONES TO WATCH</span>
            <span className="bg-amber-400 text-black text-[9px] px-2 py-0.5 font-black uppercase tracking-wider">
              OTW
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#777]">
          <span>FEATURED TALENTS</span>
          <span className="text-[#444]">•</span>
          <span className="text-amber-400/80 font-bold">{players.length} PLAYERS</span>
        </div>
      </div>

      {/* Infinite Stock Ticker Carousel (Smooth Relaxed Glide to the Left) */}
      <div
        className="w-full relative overflow-hidden py-1 group"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 3%, black 97%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 3%, black 97%, transparent)'
        }}
      >
        <div
          className="flex w-max animate-ticker items-center gap-3 sm:gap-4 group-hover:[animation-play-state:paused]"
          style={{ animationDuration: `${animationDurationSeconds}s` }}
        >
          {loopedPlayers.map((player, idx) => {
            const teamName = player.franchises?.name || player.country || 'Free Agent'
            const flag = getCountryFlag(player.country || teamName)
            const photoUrl = player.photo_url || '/placeholder-avatar.png'
            const isOtwTagged = Array.isArray(player.badges) && player.badges.includes('OTW')

            return (
              <div
                key={`${player.id}-${idx}`}
                onClick={() => setSelectedPlayer(player)}
                className="w-48 h-48 sm:w-56 sm:h-56 rounded-none overflow-hidden border border-[#242424] hover:border-amber-400 bg-[#080808] relative group/card cursor-pointer shrink-0 transition-all duration-300 hover:scale-[1.02] shadow-2xl"
              >
                {/* Full-bleed Square Player Photo */}
                <img
                  src={photoUrl}
                  alt={player.name}
                  loading="lazy"
                  className="w-full h-full object-cover object-top group-hover/card:scale-105 transition-transform duration-500 ease-out"
                />

                {/* Dark Vignette Overlay for High-Contrast Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10 pointer-events-none" />

                {/* Top Left: Nation / Franchise Badge (Sharp & High Contrast) */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/85 backdrop-blur-md px-2 py-1 border border-white/15 text-[9px] font-bold text-white shadow">
                  <span>{flag}</span>
                  <span className="truncate max-w-[90px] uppercase">{teamName}</span>
                </div>

                {/* Top Right: Badges (OTW Indicator & Position Tag) */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  {isOtwTagged && (
                    <span className="bg-amber-400 text-black font-black text-[9px] uppercase px-1.5 py-0.5 shadow tracking-wider">
                      ★ OTW
                    </span>
                  )}
                  {player.position && (
                    <div className="bg-[#111] border border-[#333] text-amber-400 font-black text-[9px] uppercase px-2 py-0.5 shadow">
                      {player.position}
                    </div>
                  )}
                </div>

                {/* Bottom Card Typography (Sharp, Edgy & Modern) */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 border-t border-white/10 pt-2 bg-black/60 backdrop-blur-sm px-2 py-1.5">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[8px] font-mono uppercase tracking-widest text-amber-400 font-extrabold">
                      {isOtwTagged ? 'FEATURED OTW' : 'SCOUT WATCH'}
                    </span>
                    <span className="text-amber-400 text-[9px] font-bold opacity-0 group-hover/card:opacity-100 transition-opacity">
                      VIEW →
                    </span>
                  </div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wide truncate drop-shadow-md">
                    {player.name}
                  </h3>
                  <div className="flex items-center justify-between text-[10px] text-[#999] mt-0.5">
                    <span className="truncate uppercase font-medium">{teamName}</span>
                    {player.goals !== undefined && player.goals > 0 && (
                      <span className="text-white font-mono text-[9px]">
                        {player.goals}G
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Smooth Marquee Glide Styles */}
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
          animation: tickerSlow linear infinite;
        }
      `}</style>

      {/* Quick Player Inspection Modal (Sharp Pointed Modern Aesthetic) */}
      {selectedPlayer && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPlayer(null)}
        >
          <div
            className="bg-[#0b0b0b] border border-[#333] w-full max-w-sm rounded-none overflow-hidden shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">
                  {getCountryFlag(selectedPlayer.country || selectedPlayer.franchises?.name)}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                      {selectedPlayer.franchises?.name || selectedPlayer.country || 'Free Agent'}
                    </span>
                    {Array.isArray(selectedPlayer.badges) && selectedPlayer.badges.includes('OTW') && (
                      <span className="bg-amber-400 text-black text-[8px] font-black uppercase px-1 py-0.2">
                        ★ OTW
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-black uppercase text-white">
                    {selectedPlayer.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="w-7 h-7 rounded-none bg-[#1c1c1c] hover:bg-[#2c2c2c] text-[#aaa] hover:text-white flex items-center justify-center text-xs transition-colors border border-[#333]"
              >
                ✕
              </button>
            </div>

            {/* Photo Preview in Modal */}
            <div className="relative w-full h-56 rounded-none overflow-hidden bg-black border border-[#222]">
              <img
                src={selectedPlayer.photo_url || '/placeholder-avatar.png'}
                alt={selectedPlayer.name}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute top-2.5 right-2.5 bg-amber-400 text-black font-black text-xs uppercase px-2.5 py-1 rounded-none shadow">
                {selectedPlayer.position || 'Player'}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#121212] p-2.5 rounded-none border border-[#222]">
                <span className="text-[9px] text-[#777] font-bold uppercase block">Position</span>
                <span className="text-xs font-black text-white">{selectedPlayer.position || 'N/A'}</span>
              </div>
              <div className="bg-[#121212] p-2.5 rounded-none border border-[#222]">
                <span className="text-[9px] text-[#777] font-bold uppercase block">Goals</span>
                <span className="text-xs font-black text-emerald-400">{selectedPlayer.goals || 0}</span>
              </div>
              <div className="bg-[#121212] p-2.5 rounded-none border border-[#222]">
                <span className="text-[9px] text-[#777] font-bold uppercase block">Assists</span>
                <span className="text-xs font-black text-amber-400">{selectedPlayer.assists || 0}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <Link
                href={`/player/${selectedPlayer.id}`}
                className="flex-1 bg-white text-black text-center py-3 rounded-none font-black text-xs uppercase tracking-wider hover:bg-[#ddd] transition-colors border border-white"
              >
                View Full Profile
              </Link>
              <Link
                href="/fantasy"
                className="flex-1 bg-gradient-to-r from-amber-400 to-amber-500 text-black text-center py-3 rounded-none font-black text-xs uppercase tracking-wider hover:brightness-110 transition-all border border-amber-400"
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
