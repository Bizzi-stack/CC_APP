'use client'

import React, { useEffect, useState } from 'react'
import { getCountryFlag } from '@/lib/countries'

interface RosterPlayer {
  id: string
  name: string
  position?: string
  photo_url?: string
  country?: string
  value?: number
  badges?: string[]
  goals?: number
  assists?: number
  is_franchise_owner?: boolean
}

interface FranchiseInfo {
  id: string
  name: string
  logo_url?: string | null
  budget?: number
  wins?: number
}

interface FranchiseRosterModalProps {
  franchiseId?: string | null
  franchiseName?: string | null
  onClose: () => void
  onSelectPlayer?: (player: RosterPlayer) => void
}

export default function FranchiseRosterModal({
  franchiseId,
  franchiseName,
  onClose,
  onSelectPlayer
}: FranchiseRosterModalProps) {
  const [franchise, setFranchise] = useState<FranchiseInfo | null>(null)
  const [roster, setRoster] = useState<RosterPlayer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const loadFranchiseData = async () => {
      try {
        setLoading(true)
        const [fRes, pRes] = await Promise.all([
          fetch('/api/franchises'),
          fetch('/api/players?status=active')
        ])

        const fData = await fRes.json()
        const pData = await pRes.json()

        const allFranchises: FranchiseInfo[] = fData.franchises || []
        const allPlayers: RosterPlayer[] = pData.players || []

        // Match franchise by ID or Name
        let matchedFranchise = allFranchises.find(f => 
          (franchiseId && f.id === franchiseId) || 
          (franchiseName && f.name.toLowerCase() === franchiseName.toLowerCase())
        )

        if (!matchedFranchise && (franchiseId || franchiseName)) {
          matchedFranchise = {
            id: franchiseId || 'unknown',
            name: franchiseName || 'Team Roster',
            logo_url: null
          }
        }

        if (isMounted) setFranchise(matchedFranchise || null)

        // Filter players for this franchise
        const targetId = matchedFranchise?.id || franchiseId
        const targetName = matchedFranchise?.name || franchiseName

        const teamPlayers = allPlayers.filter((p: any) => {
          if (targetId && (p.franchise_id === targetId || p.owned_franchise_id === targetId)) return true
          if (targetName && p.franchises?.name?.toLowerCase() === targetName.toLowerCase()) return true
          return false
        })

        if (isMounted) setRoster(teamPlayers)
      } catch (err) {
        console.error('Error loading franchise roster', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadFranchiseData()
    return () => { isMounted = false }
  }, [franchiseId, franchiseName])

  const totalRosterValue = roster.reduce((sum, p) => sum + (p.value || 0), 0)

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#0a0a0c] border border-amber-500/30 p-6 rounded-2xl shadow-2xl space-y-4 text-left max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#222] pb-4 shrink-0">
          <div className="flex items-center gap-3">
            {franchise?.logo_url ? (
              <img
                src={franchise.logo_url}
                alt=""
                className="w-12 h-12 rounded-full object-cover border border-[#333] shadow-md shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[#161616] border border-[#333] flex items-center justify-center font-black text-amber-400 text-lg shadow-md shrink-0">
                {(franchise?.name || franchiseName || 'FC').substring(0, 2).toUpperCase()}
              </div>
            )}

            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wide">
                {franchise?.name || franchiseName || 'Team Roster'}
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-[#777] font-mono uppercase mt-0.5">
                <span>{roster.length} Signed Players</span>
                <span>·</span>
                <span className="text-emerald-400 font-bold">
                  Total Valuation: {totalRosterValue.toLocaleString()} CR
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1c1c1c] hover:bg-[#333] text-[#aaa] hover:text-white flex items-center justify-center text-xs font-bold transition-colors shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Roster List Container */}
        <div className="overflow-y-auto pr-1 space-y-2.5 flex-1 custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-xs text-[#666] uppercase tracking-widest animate-pulse font-mono">
              Loading team roster...
            </div>
          ) : roster.length === 0 ? (
            <div className="p-8 text-center border border-[#1a1a1a] rounded-xl bg-[#070707]">
              <p className="text-[#666] text-xs font-mono">No active players assigned to this franchise yet.</p>
            </div>
          ) : (
            roster.map(player => {
              const flag = getCountryFlag(player.country)
              return (
                <div
                  key={player.id}
                  onClick={() => {
                    if (onSelectPlayer) {
                      onSelectPlayer(player)
                    }
                  }}
                  className="bg-[#101012] hover:bg-[#18181c] border border-[#222] hover:border-amber-500/40 p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] group"
                >
                  {/* Left Player Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full border border-[#333] bg-[#1a1a1a] overflow-hidden shrink-0">
                      {player.photo_url ? (
                        <img src={player.photo_url} alt="" className="w-full h-full object-cover object-top" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#666] font-bold text-xs">
                          ⚽
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-white group-hover:text-amber-300 transition-colors uppercase truncate">
                          {player.name}
                        </span>
                        {flag && <span className="text-xs">{flag}</span>}
                        {player.is_franchise_owner && (
                          <span className="text-[8px] bg-red-950/80 border border-red-500/50 text-red-400 px-1 py-0.2 rounded font-bold uppercase">
                            Owner
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-[#777] font-mono">
                        {player.position && (
                          <span className="bg-[#1c1c1c] text-[#ccc] px-1.5 py-0.2 rounded border border-[#333] font-bold">
                            {player.position}
                          </span>
                        )}
                        <span>{player.goals || 0} G · {player.assists || 0} A</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Transfer Value */}
                  <div className="text-right shrink-0 space-y-1">
                    <div className="text-xs font-mono font-black text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
                      {(player.value || 0).toLocaleString()} CR
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
