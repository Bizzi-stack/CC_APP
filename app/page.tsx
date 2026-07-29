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
      <div className="absolute inset-0 z-0 opacity-55">
        <img
          src="https://ayxcbvzeptwplidkwmob.supabase.co/storage/v1/object/public/assets/background.gif.gif"
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
      </div>

      {/* Top Header Logo */}
      <div className="relative z-10 flex flex-col items-center pt-8">
        <img src="/logo.png" alt="ARTIC" className="h-20 md:h-28 object-contain scale-[1.8] md:scale-[2.5] mb-2" />
        <p className="text-[10px] text-amber-400 font-mono tracking-[0.3em] uppercase mt-4">
          The Circle Football Community
        </p>
      </div>

      {/* Foreground Content Card */}
      <div className="relative z-10 w-full max-w-[420px] mx-auto my-auto pt-4">
        {checkingAuth ? (
          <div className="bg-black/80 backdrop-blur-xl border border-[#333] p-8 text-center rounded-2xl animate-pulse">
            <p className="text-xs text-[#888] font-mono uppercase tracking-widest">Checking saved session...</p>
          </div>
        ) : activePlayer ? (
          /* Logged In Card (Instagram Style Persistence) */
          <div className="bg-black/85 backdrop-blur-xl border border-amber-500/40 p-6 rounded-2xl shadow-2xl text-center space-y-5 animate-fadeIn">
            <div className="flex flex-col items-center space-y-2">
              {activePlayer.photo_url ? (
                <img src={activePlayer.photo_url} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-amber-400 shadow-lg" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#1c1c1c] border-2 border-amber-400 flex items-center justify-center text-2xl font-black text-amber-400 shadow-lg">
                  {activePlayer.name.charAt(0)}
                </div>
              )}
              <h2 className="text-lg font-black text-white uppercase tracking-wide">
                Welcome back, {activePlayer.name}! ⚽
              </h2>
              <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase">
                ✓ Logged In Persistent Session
              </span>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                href="/player-portal"
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-400 text-black text-xs font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg"
              >
                <span>👤</span>
                <span>Open Player Portal</span>
              </Link>

              <Link
                href="/home"
                className="w-full h-12 bg-[#18181c] border border-[#333] hover:border-white text-white text-xs font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <span>🏆</span>
                <span>Community Home Feed</span>
              </Link>
            </div>

            <button
              onClick={handleLogout}
              className="text-[10px] text-[#777] hover:text-red-400 font-mono uppercase tracking-wider pt-2 block mx-auto underline transition-colors"
            >
              🚪 Switch Account / Log Out
            </button>
          </div>
        ) : (
          /* Login Form for New / Unauthenticated Devices */
          <div className="bg-black/85 backdrop-blur-xl border border-[#333] p-7 rounded-2xl shadow-2xl space-y-6">
            <div className="text-center space-y-1">
              <h1 className="text-lg font-black text-white uppercase tracking-widest">Player Access</h1>
              <p className="text-[10px] text-[#888] font-mono tracking-wider">
                Select your name & passcode to enter
              </p>
            </div>

            {loading ? (
              <div className="text-center text-xs text-[#666] font-mono uppercase py-8 animate-pulse">
                Loading players...
              </div>
            ) : (
              <form onSubmit={handlePlayerLogin} className={`space-y-5 ${shaking ? 'animate-shake' : ''}`}>
                {/* Select Player Name */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-[#888] block font-mono">
                    Select Your Player Name
                  </label>
                  <select
                    required
                    value={selectedPlayerId}
                    onChange={e => {
                      setSelectedPlayerId(e.target.value)
                      setError('')
                    }}
                    className="w-full h-12 px-4 bg-[#111] border border-[#333] text-white text-sm outline-none focus:border-amber-400 transition-colors rounded-xl cursor-pointer"
                  >
                    <option value="">-- Select Player Account --</option>
                    {players.map(player => (
                      <option key={player.id} value={player.id} className="bg-black text-white">
                        {player.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Passcode */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-[#888] block font-mono">
                    Enter Passcode
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
                    className="w-full h-12 px-4 bg-[#111] border border-[#333] text-white text-sm outline-none focus:border-amber-400 transition-colors text-center tracking-widest font-mono rounded-xl placeholder-[#444]"
                  />
                </div>

                {error && (
                  <div className="bg-red-950/60 border border-red-500 text-red-400 p-3 text-xs text-center font-mono rounded-xl">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !selectedPlayerId}
                  className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-400 text-black font-black uppercase tracking-widest text-xs hover:brightness-110 active:scale-95 transition-all rounded-xl disabled:opacity-40 shadow-lg"
                >
                  {submitting ? 'Authenticating...' : 'LOG IN & ENTER SITE'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Bottom Footer Admin Link */}
      <div className="relative z-10 pb-4 text-center">
        <Link href="/login" className="text-[10px] text-[#555] hover:text-white font-mono uppercase tracking-widest transition-colors">
          Admin Portal Login →
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
