'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AdminStatsPage() {
  const [franchises, setFranchises] = useState<any[]>([])
  const [players, setPlayers] = useState<any[]>([])
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
      const [fRes, pRes] = await Promise.all([
        fetch('/api/franchises'),
        fetch('/api/players')
      ])

      const fData = await fRes.json()
      const pData = await pRes.json()

      setFranchises(fData.franchises || [])
      setPlayers(pData.players || [])

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
