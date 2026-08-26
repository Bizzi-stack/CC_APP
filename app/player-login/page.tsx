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
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
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
        body: JSON.stringify({
          playerId: selectedPlayerId || undefined,
          playerName: !selectedPlayerId ? searchQuery.trim() : undefined,
          passcode
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate')
      }

      if (data.player) {
        localStorage.setItem('player_token', data.player.id)
        localStorage.setItem('player_name', data.player.name)
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
            <div className="space-y-2 relative">
              <label className="text-[9px] font-bold tracking-widest uppercase text-[#555] block">
                Type Your Username / Player Name
              </label>
              <input
                type="text"
                required
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  setSelectedPlayerId('')
                  setError('')
                  setShowDropdown(true)
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Type player username..."
                className="w-full h-12 px-4 bg-[#111] border border-[#333] text-white text-sm outline-none focus:border-white transition-colors font-mono placeholder-[#555]"
              />

              {/* Filtered Autocomplete Dropdown Suggestions */}
              {showDropdown && searchQuery.trim().length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 bg-[#0a0a0c] border border-[#333] max-h-48 overflow-y-auto shadow-2xl mt-1">
                  {players.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                    <div className="p-3 text-[11px] text-[#777] font-mono text-center">
                      No matching players — will try logging in as &quot;{searchQuery}&quot;
                    </div>
                  ) : (
                    players
                      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedPlayerId(p.id)
                            setSearchQuery(p.name)
                            setShowDropdown(false)
                            setError('')
                          }}
                          className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-[#1f1f1f] text-left transition-colors border-b border-[#1a1a1a] last:border-b-0 cursor-pointer"
                        >
                          <span className="text-xs font-bold text-white font-mono">{p.name}</span>
                        </button>
                      ))
                  )}
                </div>
              )}
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
              disabled={submitting || (!selectedPlayerId && !searchQuery.trim())}
              className="w-full h-12 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-gray-200 active:opacity-60 transition-all disabled:opacity-30 disabled:hover:bg-white"
            >
              {submitting ? 'Connecting...' : 'Access Portal'}
            </button>
          </form>
        )}

        {/* Register / Submit Profile Section */}
        <div className="pt-4 border-t border-[#222] text-center space-y-3">
          <p className="text-[10px] text-[#666] font-mono uppercase tracking-widest">
            New Player? Submit profile &amp; join a UWIFA team
          </p>
          <Link
            href="/join"
            className="w-full h-11 border border-amber-500/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-extrabold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all cursor-pointer relative z-20"
          >
            <span>⚽</span> REGISTER / SUBMIT PROFILE →
          </Link>
        </div>
      </div>

      {/* Footer message */}
      <div className="text-center text-[9px] text-[#444] uppercase tracking-wider">
        Contact your franchise or BD to reset your passcode.
      </div>
    </div>
  )
}
