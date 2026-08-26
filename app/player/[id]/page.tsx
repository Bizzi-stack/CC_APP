'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import PublicNav from '@/components/PublicNav'
import VerificationBadge from '@/components/VerificationBadge'
import { getCountryFlag } from '@/lib/countries'
import FranchiseRosterModal from '@/components/FranchiseRosterModal'
import { TopScorerBadge, TopAssisterBadge } from '@/components/TopBadges'

interface Player {
  id: string
  name: string
  position?: string
  photo_url?: string
  goals: number
  assists: number
  value?: number
  country?: string | null
  badges?: string[] | null
  verification_badge?: string | null
  is_top_scorer?: boolean
  is_top_assister?: boolean
  franchises?: {
    name: string
    logo_url: string | null
  } | null
}

export default function PlayerStatsPage() {
  const params = useParams()
  const playerId = params.id as string
  const [player, setPlayer] = useState<Player | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewRosterFranchise, setViewRosterFranchise] = useState<{ id?: string, name?: string } | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  const scrollToChart = () => {
    chartRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (!playerId) return

    Promise.all([
      fetch(`/api/players?status=active`),
      fetch(`/api/player/history?player_id=${playerId}`)
    ])
      .then(async ([resPlayers, resHistory]) => {
        const data = await resPlayers.json()
        const historyData = await resHistory.json()

        const found = data.players?.find((p: Player) => p.id === playerId)
        if (found) {
          setPlayer(found)
          
          if (historyData.history) {
            // Format history data for chart
            const chartData = historyData.history.map((h: any) => ({
              date: new Date(h.created_at).toLocaleDateString(),
              value: h.new_value,
              reason: h.change_reason
            }))
            // Add initial point if needed, but the query gives chronologically
            setHistory(chartData)
          }
        } else {
          setError('Player not found')
        }
      })
      .catch(err => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [playerId])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="text-[#555] text-sm tracking-widest uppercase animate-pulse">Loading Stats...</div>
      </div>
    )
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <p className="text-[#888] text-sm mb-4">{error || 'Player not found'}</p>
        <Link href="/market" className="text-white text-sm underline tracking-wider uppercase">← Back to Market</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="bg-[#050505] border-b border-[#222] p-6 pt-12 relative overflow-hidden">
        <Link href="/market" className="relative z-10 text-[#888] hover:text-white transition-colors text-xs font-bold uppercase tracking-wider mb-6 block w-max">
          ← Transfer Market
        </Link>
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-2xl overflow-hidden border border-[#222] bg-[#111] shadow-2xl">
            {player.photo_url ? (
              <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover object-top" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-4xl font-bold text-[#444]">
                  {player.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight uppercase flex items-center gap-2 flex-wrap mb-2">
              {player.name}
              <VerificationBadge type={player.verification_badge} className="w-6 h-6 sm:w-8 sm:h-8" />
              {player.is_top_scorer && <TopScorerBadge className="w-7 h-7 sm:w-8 sm:h-8" />}
              {player.is_top_assister && <TopAssisterBadge className="w-7 h-7 sm:w-8 sm:h-8" />}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-white tracking-widest uppercase border border-[#333] bg-[#111] px-3 py-1.5 flex items-center gap-1.5">
                <span>{getCountryFlag(player.country)}</span>
                <span>{player.country || 'Barbados'}</span>
              </span>
              {player.franchises && (
                <button
                  type="button"
                  onClick={() => setViewRosterFranchise({ name: player.franchises?.name })}
                  className="flex items-center gap-2 bg-[#111] border border-[#333] hover:border-amber-500/50 px-3 py-1.5 transition-colors group cursor-pointer"
                  title={`View ${player.franchises.name} Roster`}
                >
                  {player.franchises.logo_url && (
                    <img src={player.franchises.logo_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                  )}
                  <span className="text-xs font-bold tracking-widest uppercase text-white group-hover:text-amber-300 transition-colors flex items-center gap-1">
                    <span>{player.franchises.name}</span>
                    <span className="text-[10px] text-amber-400 font-mono">👥</span>
                  </span>
                </button>
              )}
              {player.position && (
                <span className="text-xs font-bold text-[#888] tracking-widest uppercase border border-[#222] px-3 py-1.5">
                  {player.position}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-4xl mx-auto p-6 mt-8">
        <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-[#aaa] mb-8 flex items-center gap-3">
          <div className="w-8 h-px bg-[#333]" />
          Career Statistics
          <div className="flex-1 h-px bg-[#333]" />
        </h2>

        <div className="grid grid-cols-2 gap-6">
          {/* Goals */}
          <div className="bg-[#0a0a0a] border border-[#222] p-6 rounded-2xl relative overflow-hidden group hover:border-[#444] transition-colors">
            <div className="absolute -right-4 -bottom-4 text-9xl text-white opacity-[0.02] font-black pointer-events-none group-hover:scale-110 transition-transform duration-500">
              G
            </div>
            <p className="text-xs font-bold tracking-[0.2em] text-[#666] uppercase mb-4 relative z-10">Total Goals</p>
            <p className="text-6xl font-black relative z-10">{player.goals || 0}</p>
          </div>

          {/* Assists */}
          <div className="bg-[#0a0a0a] border border-[#222] p-6 rounded-2xl relative overflow-hidden group hover:border-[#444] transition-colors">
            <div className="absolute -right-4 -bottom-4 text-9xl text-white opacity-[0.02] font-black pointer-events-none group-hover:scale-110 transition-transform duration-500">
              A
            </div>
            <p className="text-xs font-bold tracking-[0.2em] text-[#666] uppercase mb-4 relative z-10">Total Assists</p>
            <p className="text-6xl font-black relative z-10">{player.assists || 0}</p>
          </div>
        </div>
      </div>

      {/* Franchise Roster Modal */}
      {viewRosterFranchise && (
        <FranchiseRosterModal
          franchiseName={viewRosterFranchise.name}
          onClose={() => setViewRosterFranchise(null)}
          onSelectPlayer={(p: any) => {
            setViewRosterFranchise(null)
            window.location.href = `/player/${p.id}`
          }}
        />
      )}

      <PublicNav />
    </div>
  )
}
