'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AdminStatsPage() {
  const [franchises, setFranchises] = useState<any[]>([])
  const [players, setPlayers] = useState<any[]>([])
  const [challenges, setChallenges] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  
  // State for form inputs
  const [playerForm, setPlayerForm] = useState<{ [id: string]: { goals: number, assists: number } }>({})
  const [franchiseForm, setFranchiseForm] = useState<{ [id: string]: { wins: number, draws: number, losses: number, goals_for: number, goals_against: number } }>({})

  // Ones To Watch management state
  const [otwSearch, setOtwSearch] = useState('')
  const [otwFilter, setOtwFilter] = useState<'all' | 'otw_only'>('all')
  const [otwTogglingId, setOtwTogglingId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [fRes, pRes, cRes] = await Promise.all([
        fetch('/api/franchises'),
        fetch('/api/players'),
        fetch('/api/admin/challenges/resolve')
      ])

      const fData = await fRes.json()
      const pData = await pRes.json()
      const cData = await cRes.json()

      setFranchises(fData.franchises || [])
      setPlayers(pData.players || [])
      setChallenges(cData.challenges || [])

      // Initialize forms
      const pForm: any = {}
      ;(pData.players || []).forEach((p: any) => {
        pForm[p.id] = { goals: p.goals || 0, assists: p.assists || 0 }
      })
      setPlayerForm(pForm)

      const fForm: any = {}
      ;(fData.franchises || []).forEach((f: any) => {
        fForm[f.id] = { 
          wins: f.wins || 0, 
          draws: f.draws || 0, 
          losses: f.losses || 0, 
          goals_for: f.goals_for || 0, 
          goals_against: f.goals_against || 0 
        }
      })
      setFranchiseForm(fForm)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleResolveChallenge = async (challengeId: string, winnerId: string | null) => {
    const confirmMsg = winnerId ? 'Declare this franchise as the winner and payout the pot?' : 'Declare this match a draw and refund both franchises?'
    if (!confirm(confirmMsg)) return

    setUpdatingId(challengeId)
    try {
      const res = await fetch('/api/admin/challenges/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: challengeId, winner_id: winnerId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to resolve')
      alert('Match resolved successfully!')
      fetchData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleUpdatePlayer = async (id: string) => {
    setUpdatingId(id)
    try {
      await fetch('/api/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'player', id, updates: playerForm[id] })
      })
      alert('Player stats updated!')
    } catch (err) {
      alert('Error updating player stats')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleUpdateFranchise = async (id: string) => {
    setUpdatingId(id)
    try {
      await fetch('/api/admin/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'franchise', id, updates: franchiseForm[id] })
      })
      alert('Franchise stats updated!')
    } catch (err) {
      alert('Error updating franchise stats')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleToggleOtw = async (playerId: string, isCurrentlyOtw: boolean) => {
    setOtwTogglingId(playerId)
    try {
      const res = await fetch('/api/admin/otw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId, is_otw: !isCurrentlyOtw })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update OTW status')

      // Update local players state
      setPlayers(prev =>
        prev.map(p => {
          if (p.id === playerId) {
            const currentBadges = Array.isArray(p.badges) ? [...p.badges] : []
            const newBadges = !isCurrentlyOtw
              ? currentBadges.includes('OTW')
                ? currentBadges
                : [...currentBadges, 'OTW']
              : currentBadges.filter((b: string) => b !== 'OTW')
            return { ...p, badges: newBadges }
          }
          return p
        })
      )
    } catch (err: any) {
      alert(err.message || 'Error updating OTW status')
    } finally {
      setOtwTogglingId(null)
    }
  }

  if (loading) return <div className="min-h-screen bg-black text-white p-12 text-center">Loading...</div>

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-4xl mx-auto">
      <Link href="/home" className="text-[#888] hover:text-white mb-6 block text-xs">← Back Home</Link>
      <h1 className="text-xl font-bold uppercase tracking-widest mb-12">Admin Stats Portal</h1>

      <section className="mb-16">
        <h2 className="text-amber-500 font-bold uppercase tracking-widest mb-6">Active Wager Matches</h2>
        <div className="space-y-4">
          {challenges.filter(c => c.status === 'accepted').length === 0 ? (
            <p className="text-[#555] text-sm">No active wager matches waiting for resolution.</p>
          ) : (
            challenges.filter(c => c.status === 'accepted').map(c => (
              <div key={c.id} className="border border-[#333] p-6 bg-[#050505]">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-center flex-1">
                    <p className="font-bold text-white mb-2">{c.challenger.name}</p>
                    <button 
                      disabled={updatingId === c.id}
                      onClick={() => handleResolveChallenge(c.id, c.challenger_id)}
                      className="bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-gray-200"
                    >
                      Winner
                    </button>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-amber-500 font-bold uppercase tracking-widest text-sm mb-1">VS</p>
                    <p className="text-[#555] font-mono font-bold text-xs">POT: {(c.wager_amount * 2).toLocaleString()} CR</p>
                    <button 
                      disabled={updatingId === c.id}
                      onClick={() => handleResolveChallenge(c.id, null)}
                      className="mt-4 border border-[#333] text-white px-4 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-[#111]"
                    >
                      Draw (Refund)
                    </button>
                  </div>
                  <div className="text-center flex-1">
                    <p className="font-bold text-white mb-2">{c.challenged.name}</p>
                    <button 
                      disabled={updatingId === c.id}
                      onClick={() => handleResolveChallenge(c.id, c.challenged_id)}
                      className="bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-gray-200"
                    >
                      Winner
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Ones To Watch (OTW) Manager Section */}
      <section className="mb-16 border border-[#222] bg-[#070707] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#1f1f1f]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-amber-400 animate-pulse" />
              <h2 className="text-amber-500 font-black uppercase tracking-widest text-sm sm:text-base">
                ONES TO WATCH (OTW) MANAGER
              </h2>
            </div>
            <p className="text-xs text-[#777]">
              Feature players on the homepage & login ticker. Changes take effect immediately.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 border border-amber-500/30 px-2.5 py-1">
              {players.filter(p => Array.isArray(p.badges) && p.badges.includes('OTW')).length} FEATURED
            </span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search player by name or club..."
              value={otwSearch}
              onChange={e => setOtwSearch(e.target.value)}
              className="w-full bg-[#111] border border-[#333] text-white px-3 py-2 text-xs placeholder-[#555] focus:outline-none focus:border-amber-400"
            />
            {otwSearch && (
              <button
                onClick={() => setOtwSearch('')}
                className="absolute right-2.5 top-2 text-[#666] hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex gap-2 text-xs">
            <button
              onClick={() => setOtwFilter('all')}
              className={`px-3 py-2 uppercase font-bold tracking-wider transition-colors ${
                otwFilter === 'all'
                  ? 'bg-white text-black'
                  : 'bg-[#141414] text-[#888] hover:text-white border border-[#262626]'
              }`}
            >
              All Players ({players.length})
            </button>
            <button
              onClick={() => setOtwFilter('otw_only')}
              className={`px-3 py-2 uppercase font-bold tracking-wider transition-colors ${
                otwFilter === 'otw_only'
                  ? 'bg-amber-400 text-black'
                  : 'bg-[#141414] text-[#888] hover:text-white border border-[#262626]'
              }`}
            >
              ★ OTW Only ({players.filter(p => Array.isArray(p.badges) && p.badges.includes('OTW')).length})
            </button>
          </div>
        </div>

        {/* Players List Grid / Rows */}
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {(() => {
            const filtered = players.filter(p => {
              const isOtw = Array.isArray(p.badges) && p.badges.includes('OTW')
              if (otwFilter === 'otw_only' && !isOtw) return false

              if (otwSearch.trim() !== '') {
                const q = otwSearch.toLowerCase()
                const matchesName = p.name?.toLowerCase().includes(q)
                const matchesTeam = p.franchises?.name?.toLowerCase().includes(q) || p.country?.toLowerCase().includes(q)
                const matchesPos = p.position?.toLowerCase().includes(q)
                return matchesName || matchesTeam || matchesPos
              }
              return true
            })

            if (filtered.length === 0) {
              return (
                <div className="text-center py-10 text-xs text-[#555] border border-[#1a1a1a]">
                  No players found matching your filter or search.
                </div>
              )
            }

            return filtered.map(p => {
              const isOtw = Array.isArray(p.badges) && p.badges.includes('OTW')
              const isUpdating = otwTogglingId === p.id
              const teamName = p.franchises?.name || p.country || 'Free Agent'

              return (
                <div
                  key={p.id}
                  className={`p-3 flex items-center justify-between gap-3 border transition-colors ${
                    isOtw
                      ? 'bg-[#120f05] border-amber-500/40'
                      : 'bg-[#0e0e0e] border-[#1e1e1e] hover:border-[#2a2a2a]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Thumbnail */}
                    <div className="w-10 h-10 shrink-0 bg-black border border-[#222] overflow-hidden">
                      <img
                        src={p.photo_url || '/placeholder-avatar.png'}
                        alt={p.name}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs truncate">{p.name}</span>
                        {isOtw && (
                          <span className="bg-amber-400 text-black text-[8px] font-black px-1 uppercase tracking-wider">
                            OTW
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#777] flex items-center gap-2 mt-0.5">
                        <span className="truncate uppercase">{teamName}</span>
                        <span>•</span>
                        <span className="text-amber-400 font-bold uppercase">{p.position || 'Player'}</span>
                        {p.goals > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400">{p.goals}G</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    disabled={isUpdating}
                    onClick={() => handleToggleOtw(p.id, isOtw)}
                    className={`shrink-0 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      isOtw
                        ? 'bg-amber-400 text-black border-amber-400 hover:bg-red-500 hover:text-white hover:border-red-500'
                        : 'bg-[#161616] text-[#aaa] border-[#333] hover:text-white hover:border-amber-400 hover:bg-black'
                    }`}
                  >
                    {isUpdating ? 'Saving...' : isOtw ? '★ Featured in OTW' : '+ Add to OTW'}
                  </button>
                </div>
              )
            })
          })()}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-amber-500 font-bold uppercase tracking-widest mb-6">Franchise Stats (League Table)</h2>
        <div className="space-y-4">
          {franchises.map(f => (
            <div key={f.id} className="border border-[#222] bg-[#0a0a0a] p-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-48 font-bold">{f.name}</div>
              <div className="flex flex-wrap gap-4 flex-1">
                <label className="text-xs">W: <input type="number" className="bg-[#111] border border-[#333] w-16 p-1 text-white" value={franchiseForm[f.id]?.wins} onChange={e => setFranchiseForm(prev => ({ ...prev, [f.id]: { ...prev[f.id], wins: parseInt(e.target.value) || 0 } }))} /></label>
                <label className="text-xs">D: <input type="number" className="bg-[#111] border border-[#333] w-16 p-1 text-white" value={franchiseForm[f.id]?.draws} onChange={e => setFranchiseForm(prev => ({ ...prev, [f.id]: { ...prev[f.id], draws: parseInt(e.target.value) || 0 } }))} /></label>
                <label className="text-xs">L: <input type="number" className="bg-[#111] border border-[#333] w-16 p-1 text-white" value={franchiseForm[f.id]?.losses} onChange={e => setFranchiseForm(prev => ({ ...prev, [f.id]: { ...prev[f.id], losses: parseInt(e.target.value) || 0 } }))} /></label>
                <label className="text-xs">GF: <input type="number" className="bg-[#111] border border-[#333] w-16 p-1 text-white" value={franchiseForm[f.id]?.goals_for} onChange={e => setFranchiseForm(prev => ({ ...prev, [f.id]: { ...prev[f.id], goals_for: parseInt(e.target.value) || 0 } }))} /></label>
                <label className="text-xs">GA: <input type="number" className="bg-[#111] border border-[#333] w-16 p-1 text-white" value={franchiseForm[f.id]?.goals_against} onChange={e => setFranchiseForm(prev => ({ ...prev, [f.id]: { ...prev[f.id], goals_against: parseInt(e.target.value) || 0 } }))} /></label>
              </div>
              <button disabled={updatingId === f.id} onClick={() => handleUpdateFranchise(f.id)} className="bg-white text-black text-xs font-bold px-4 py-2 hover:bg-gray-200 uppercase">
                {updatingId === f.id ? '...' : 'Save'}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-amber-500 font-bold uppercase tracking-widest mb-6">Player Stats (Goals & Assists)</h2>
        <div className="space-y-4">
          {players.map(p => (
            <div key={p.id} className="border border-[#222] bg-[#0a0a0a] p-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-48 font-bold">{p.name}</div>
              <div className="flex gap-4 flex-1">
                <label className="text-xs">Goals: <input type="number" className="bg-[#111] border border-[#333] w-16 p-1 text-white" value={playerForm[p.id]?.goals} onChange={e => setPlayerForm(prev => ({ ...prev, [p.id]: { ...prev[p.id], goals: parseInt(e.target.value) || 0 } }))} /></label>
                <label className="text-xs">Assists: <input type="number" className="bg-[#111] border border-[#333] w-16 p-1 text-white" value={playerForm[p.id]?.assists} onChange={e => setPlayerForm(prev => ({ ...prev, [p.id]: { ...prev[p.id], assists: parseInt(e.target.value) || 0 } }))} /></label>
              </div>
              <button disabled={updatingId === p.id} onClick={() => handleUpdatePlayer(p.id)} className="bg-white text-black text-xs font-bold px-4 py-2 hover:bg-gray-200 uppercase">
                {updatingId === p.id ? '...' : 'Save'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
