'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Player {
  id: string
  name: string
}

export default function PlayerLoginPage() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [passcode, setPasscode] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/players?status=active&t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setPlayers(data.players || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const res = await fetch('/api/player/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: selectedPlayerId, passcode })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate')
      }

      window.location.href = '/player-portal'
    } catch (err: any) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-between p-6 pb-12">
      {/* Top Header */}
      <div className="flex justify-between items-center pt-6">
        <Link href="/home" className="text-[#888] hover:text-white transition-colors text-xs font-bold uppercase tracking-wider">
          ← Home
        </Link>
        <div className="w-10" />
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-[400px] mx-auto border border-[#222] bg-[#0a0a0a] p-8 shadow-2xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-bold tracking-widest uppercase">Player Portal</h1>
          <p className="text-[10px] text-[#555] tracking-widest uppercase font-bold">Collect wages & configure canvas</p>
        </div>

        {loading ? (
          <div className="text-center text-xs text-[#555] uppercase tracking-widest py-8 animate-pulse">
            Loading active players...
          </div>
        ) : players.length === 0 ? (
          <div className="border border-[#222] border-dashed p-6 text-center text-[#555] text-xs uppercase tracking-wider">
            No active players registered yet.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-bold tracking-widest uppercase text-[#555] block">
                Select Your Player Name
              </label>
              <select
                required
                value={selectedPlayerId}
                onChange={e => {
                  setSelectedPlayerId(e.target.value)
                  setError('')
                }}
                className="w-full h-12 px-4 bg-[#111] border border-[#333] text-white text-sm outline-none focus:border-white transition-colors appearance-none cursor-pointer"
              >
                <option value="">-- Select Player --</option>
                {players.map(player => (
                  <option key={player.id} value={player.id} className="bg-black">
                    {player.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold tracking-widest uppercase text-[#555] block">
                Enter Portal Passcode
              </label>
              <input
                type="password"
                required
                value={passcode}
                onChange={e => {
                  setPasscode(e.target.value)
                  setError('')
                }}
                placeholder="••••"
                className="w-full h-12 px-4 bg-[#111] border border-[#333] text-white text-sm outline-none focus:border-white transition-colors text-center tracking-widest font-mono focus:placeholder-transparent"
              />
            </div>

            {error && (
              <div className="bg-[#ff4444]/10 border border-[#ff4444] text-[#ff4444] p-3 text-xs text-center uppercase tracking-wider">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !selectedPlayerId}
              className="w-full h-12 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-gray-200 active:opacity-60 transition-all disabled:opacity-30 disabled:hover:bg-white"
            >
              {submitting ? 'Connecting...' : 'Access Portal'}
            </button>
          </form>
        )}
      </div>

      {/* Footer message */}
      <div className="text-center text-[9px] text-[#444] uppercase tracking-wider">
        Contact your franchise or BD to reset your passcode.
      </div>
    </div>
  )
}
