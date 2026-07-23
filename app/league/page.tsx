'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Franchise {
  id: string
  name: string
  logo_url: string | null
  wins: number
  draws: number
  losses: number
  goals_for: number
  goals_against: number
  points: number // computed
  gd: number // computed
}

interface Player {
  id: string
  name: string
  photo_url: string | null
  franchise_id: string | null
  franchises?: { name: string } | null
  goals: number
  assists: number
}

export default function LeaguePage() {
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fRes, pRes] = await Promise.all([
          fetch('/api/franchises'),
          fetch('/api/players?status=active')
        ])

        if (!fRes.ok || !pRes.ok) throw new Error('Failed to fetch data')

        const fData = await fRes.json()
        const pData = await pRes.json()

        // Process Franchises (Compute Points and GD)
        const computedFranchises = (fData.franchises || []).map((f: any) => ({
          ...f,
          points: (f.wins || 0) * 3 + (f.draws || 0) * 1,
          gd: (f.goals_for || 0) - (f.goals_against || 0)
        }))

        // Sort: Points DESC, GD DESC, Goals For DESC
        computedFranchises.sort((a: Franchise, b: Franchise) => {
          if (b.points !== a.points) return b.points - a.points
          if (b.gd !== a.gd) return b.gd - a.gd
          return (b.goals_for || 0) - (a.goals_for || 0)
        })

        setFranchises(computedFranchises)
        setPlayers(pData.players || [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const topScorers = [...players].sort((a, b) => (b.goals || 0) - (a.goals || 0)).slice(0, 5).filter(p => (p.goals || 0) > 0)
  const topAssists = [...players].sort((a, b) => (b.assists || 0) - (a.assists || 0)).slice(0, 5).filter(p => (p.assists || 0) > 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="text-center text-[#555] text-sm tracking-wider uppercase animate-pulse">
          Loading League Data...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header Banner */}
      <div className="bg-[#050505] border-b border-[#222] p-6 pt-12">
        <Link href="/home" className="text-[#888] hover:text-white transition-colors text-xs font-bold uppercase tracking-wider mb-6 block w-max">
          ← Home
        </Link>
        <h1 className="text-2xl font-bold tracking-widest uppercase">League & Stats</h1>
        <p className="text-[#555] text-[10px] tracking-widest uppercase font-bold mt-2">
          Standings, Top Scorers, and Top Assists
        </p>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-12 mt-6">
        {/* LEAGUE TABLE */}
        <section>
          <h2 className="text-[#555] font-bold tracking-widest uppercase text-xs mb-3 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#555]"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>
            Official Standings
          </h2>
          <div className="border border-[#222] bg-[#0a0a0a] overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#111] text-[#555] uppercase tracking-widest">
                <tr>
                  <th className="p-4 font-bold w-12 text-center">Pos</th>
                  <th className="p-4 font-bold min-w-[200px]">Franchise</th>
                  <th className="p-4 font-bold text-center" title="Matches Played">P</th>
                  <th className="p-4 font-bold text-center text-[#4caf50]" title="Wins">W</th>
                  <th className="p-4 font-bold text-center text-[#888]" title="Draws">D</th>
                  <th className="p-4 font-bold text-center text-[#f44336]" title="Losses">L</th>
                  <th className="p-4 font-bold text-center" title="Goals For">GF</th>
                  <th className="p-4 font-bold text-center" title="Goals Against">GA</th>
                  <th className="p-4 font-bold text-center" title="Goal Difference">GD</th>
                  <th className="p-4 font-bold text-center text-amber-500 text-sm">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222]">
                {franchises.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-[#555]">No franchises found.</td>
                  </tr>
                ) : (
                  franchises.map((f, index) => {
                    const played = (f.wins || 0) + (f.draws || 0) + (f.losses || 0)
                    return (
                      <tr key={f.id} className="hover:bg-[#111] transition-colors">
                        <td className="p-4 text-center font-mono text-[#888]">{index + 1}</td>
                        <td className="p-4 font-bold flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full border border-[#333] bg-black overflow-hidden flex items-center justify-center shrink-0">
                            {f.logo_url ? (
                              <img src={f.logo_url} alt={f.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] text-[#555]">{f.name.substring(0, 2)}</span>
                            )}
                          </div>
                          <span>{f.name}</span>
                        </td>
                        <td className="p-4 text-center text-[#888]">{played}</td>
                        <td className="p-4 text-center">{f.wins || 0}</td>
                        <td className="p-4 text-center">{f.draws || 0}</td>
                        <td className="p-4 text-center">{f.losses || 0}</td>
                        <td className="p-4 text-center text-[#888]">{f.goals_for || 0}</td>
                        <td className="p-4 text-center text-[#888]">{f.goals_against || 0}</td>
                        <td className="p-4 text-center font-mono text-[#aaa]">
                          {f.gd > 0 ? `+${f.gd}` : f.gd}
                        </td>
                        <td className="p-4 text-center font-mono font-bold text-amber-500 text-sm">{f.points}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* PLAYER STATS GRIDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* TOP SCORERS */}
          <section>
            <h2 className="text-[#555] font-bold tracking-widest uppercase text-xs mb-3 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#555]"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
            Top Scorers
            </h2>
            <div className="border border-[#222] bg-[#0a0a0a]">
              {topScorers.length === 0 ? (
                <div className="p-6 text-center text-[#555] text-xs uppercase tracking-wider">No goals recorded yet</div>
              ) : (
                <div className="divide-y divide-[#222]">
                  {topScorers.map((p, index) => (
                    <div key={p.id} className="p-4 flex items-center justify-between hover:bg-[#111] transition-colors">
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-[#555] text-xs w-4 text-center">{index + 1}</span>
                        <div className="w-10 h-10 rounded-full border border-[#333] bg-[#111] overflow-hidden flex items-center justify-center shrink-0">
                          {p.photo_url ? (
                            <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover object-top" />
                          ) : (
                            <span className="text-[10px] text-[#555]">{p.name.substring(0, 2)}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{p.name}</p>
                          <p className="text-[9px] text-[#888] uppercase">{p.franchises?.name || 'Free Agent'}</p>
                        </div>
                      </div>
                      <div className="font-mono text-xl font-bold text-white">{p.goals}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* TOP ASSISTS */}
          <section>
            <h2 className="text-[#555] font-bold tracking-widest uppercase text-xs mb-3 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#555]"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
            Top Assists
            </h2>
            <div className="border border-[#222] bg-[#0a0a0a]">
              {topAssists.length === 0 ? (
                <div className="p-6 text-center text-[#555] text-xs uppercase tracking-wider">No assists recorded yet</div>
              ) : (
                <div className="divide-y divide-[#222]">
                  {topAssists.map((p, index) => (
                    <div key={p.id} className="p-4 flex items-center justify-between hover:bg-[#111] transition-colors">
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-[#555] text-xs w-4 text-center">{index + 1}</span>
                        <div className="w-10 h-10 rounded-full border border-[#333] bg-[#111] overflow-hidden flex items-center justify-center shrink-0">
                          {p.photo_url ? (
                            <img src={p.photo_url} alt={p.name} className="w-full h-full object-cover object-top" />
                          ) : (
                            <span className="text-[10px] text-[#555]">{p.name.substring(0, 2)}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{p.name}</p>
                          <p className="text-[9px] text-[#888] uppercase">{p.franchises?.name || 'Free Agent'}</p>
                        </div>
                      </div>
                      <div className="font-mono text-xl font-bold text-white">{p.assists}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
