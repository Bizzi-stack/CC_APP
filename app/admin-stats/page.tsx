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
