'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Player {
  id: string
  name: string
  photo_url?: string
}

export default function LandingPage() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [passcode, setPasscode] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)

  // Current logged in player session on this device
  const [activePlayer, setActivePlayer] = useState<Player | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    // 1. Check if logged in already on this phone/device
    fetch('/api/player/me')
      .then(r => r.json())
      .then(data => {
        if (data.player) {
          setActivePlayer(data.player)
          localStorage.setItem('player_token', data.player.id)
          localStorage.setItem('player_name', data.player.name)
        }
        setCheckingAuth(false)
      })
      .catch(() => setCheckingAuth(false))

    // 2. Fetch list of active players for login dropdown
    fetch('/api/players?status=active')
      .then(res => res.json())
      .then(data => {
        setPlayers(data.players || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handlePlayerLogin = async (e: React.FormEvent) => {
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
        throw new Error(data.error || 'Incorrect passcode')
      }

      // Save token in localStorage as secondary backup
      if (data.player) {
        localStorage.setItem('player_token', data.player.id)
        localStorage.setItem('player_name', data.player.name)
      }

      // Directly take to Home Feed after login
      window.location.href = '/home'
    } catch (err: any) {
      setError(err.message || 'Login failed')
      setShaking(true)
      setSubmitting(false)
      setTimeout(() => setShaking(false), 500)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/player/logout', { method: 'POST' })
    localStorage.removeItem('player_token')
    localStorage.removeItem('player_name')
    setActivePlayer(null)
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black flex flex-col items-center justify-between p-6">

      {/* Background GIF Layer */}
      <div className="absolute inset-0 z-0 opacity-60">
        <img
          src="https://ayxcbvzeptwplidkwmob.supabase.co/storage/v1/object/public/assets/background.gif.gif"
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Top Header Logo */}
      <div className="relative z-10 flex flex-col items-center pt-12">
        <img src="/logo.png" alt="ARTIC" className="h-20 md:h-28 object-contain scale-[1.8] md:scale-[2.5]" />
      </div>

      {/* Foreground Content Card - Pure Square IMVU Minimalist Style */}
      <div className="relative z-10 w-full max-w-[400px] mx-auto my-auto">
        {checkingAuth ? (
          <div className="bg-black border border-[#333] p-8 text-center rounded-none animate-pulse">
            <p className="text-xs text-[#888] font-mono uppercase tracking-widest">Checking saved session...</p>
          </div>
        ) : activePlayer ? (
          /* Logged In Card (Square IMVU Style) */
          <div className="bg-black border border-white p-8 rounded-none shadow-2xl text-center space-y-6 animate-fadeIn">
            <div className="flex flex-col items-center space-y-3">
              {activePlayer.photo_url ? (
                <img src={activePlayer.photo_url} alt="" className="w-20 h-20 rounded-none object-cover border border-white shadow" />
              ) : (
                <div className="w-20 h-20 rounded-none bg-[#111] border border-white flex items-center justify-center text-2xl font-bold text-white shadow">
                  {activePlayer.name.charAt(0)}
                </div>
              )}
              <h2 className="text-base font-bold text-white uppercase tracking-widest">
                Welcome back, {activePlayer.name}!
              </h2>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                href="/home"
                className="w-full h-12 bg-white text-black text-xs font-bold uppercase tracking-widest rounded-none flex items-center justify-center hover:bg-gray-200 active:opacity-60 transition-all shadow"
              >
                ENTER HOME FEED →
              </Link>

              <Link
                href="/player-portal"
                className="w-full h-12 bg-black border border-[#444] hover:border-white text-white text-xs font-bold uppercase tracking-widest rounded-none flex items-center justify-center transition-all"
              >
                PLAYER PORTAL 👤
              </Link>
            </div>

            <button
              onClick={handleLogout}
              className="text-[10px] text-[#777] hover:text-white font-mono uppercase tracking-widest pt-2 block mx-auto transition-colors"
            >
              LOG OUT / SWITCH ACCOUNT 🚪
            </button>
          </div>
        ) : (
          /* Login Form for New / Unauthenticated Devices (Square IMVU Style) */
          <div className="bg-black border border-white p-8 rounded-none shadow-2xl space-y-6">
            <div className="text-center space-y-1">
              <h1 className="text-lg font-bold text-white uppercase tracking-widest">PLAYER LOGIN</h1>
            </div>

            {loading ? (
              <div className="text-center text-xs text-[#666] font-mono uppercase py-8 animate-pulse">
                Loading players...
              </div>
            ) : (
              <form onSubmit={handlePlayerLogin} className={`space-y-5 ${shaking ? 'animate-shake' : ''}`}>
                {/* Select Player Name */}
                <div className="space-y-2 text-left">
                  <label className="text-[9px] font-bold tracking-widest uppercase text-[#888] block font-mono">
                    SELECT PLAYER NAME
                  </label>
                  <select
                    required
                    value={selectedPlayerId}
                    onChange={e => {
                      setSelectedPlayerId(e.target.value)
                      setError('')
                    }}
                    className="w-full h-12 px-4 bg-black border border-[#444] text-white text-sm outline-none focus:border-white transition-colors rounded-none cursor-pointer appearance-none"
                  >
                    <option value="">-- Select Player --</option>
                    {players.map(player => (
                      <option key={player.id} value={player.id} className="bg-black text-white">
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Passcode */}
                <div className="space-y-2 text-left">
                  <label className="text-[9px] font-bold tracking-widest uppercase text-[#888] block font-mono">
                    ENTER PASSCODE
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
                    className="w-full h-12 px-4 bg-black border border-[#444] text-white text-sm outline-none focus:border-white transition-colors text-center tracking-widest font-mono rounded-none placeholder-[#444]"
                  />
                </div>

                {error && (
                  <div className="bg-[#ff4444]/10 border border-[#ff4444] text-[#ff4444] p-3 text-xs text-center font-mono rounded-none">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !selectedPlayerId}
                  className="w-full h-12 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-gray-200 active:opacity-60 transition-all rounded-none disabled:opacity-40"
                >
                  {submitting ? '...' : 'ENTER'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer Admin Link */}
      <div className="relative z-10 pb-4 text-center">
        <Link href="/login" className="text-[9px] text-[#555] hover:text-white font-mono uppercase tracking-widest transition-colors">
          ADMIN LOGIN →
        </Link>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </main>
  )
}
