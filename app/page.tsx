'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FooterPartnerTicker from '@/components/FooterPartnerTicker'

interface Player {
  id: string
  name: string
  photo_url?: string
}

export default function LandingPage() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
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
        body: JSON.stringify({
          playerId: selectedPlayerId || undefined,
          playerName: !selectedPlayerId ? searchQuery.trim() : undefined,
          passcode
        })
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
    <main className="relative min-h-screen w-full overflow-x-hidden bg-black flex flex-col items-center justify-between p-6">

      {/* Background GIF Layer - Dark Atmospheric Vignette Overlay */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
        <img
          src="https://ayxcbvzeptwplidkwmob.supabase.co/storage/v1/object/public/assets/background.gif.gif"
          alt="Background"
          className="w-full h-full object-cover filter brightness-50 contrast-125 pointer-events-none select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/75 to-black pointer-events-none" />
      </div>

      {/* Top Header Logo */}
      <div className="relative z-10 flex flex-col items-center pt-8 pb-4">
        <img src="/logo.png" alt="College Clubs FC" className="h-28 md:h-36 w-auto object-contain drop-shadow-xl" />
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
                PLAYER PORTAL
              </Link>
            </div>

            <button
              onClick={handleLogout}
              className="text-[10px] text-[#777] hover:text-white font-mono uppercase tracking-widest pt-2 block mx-auto transition-colors"
            >
              LOG OUT / SWITCH ACCOUNT
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
                {/* Type Username / Select Player */}
                <div className="space-y-2 text-left relative">
                  <label className="text-[9px] font-bold tracking-widest uppercase text-[#888] block font-mono">
                    ENTER USERNAME / PLAYER NAME
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
                    className="w-full h-12 px-4 bg-black border border-[#444] text-white text-sm outline-none focus:border-white transition-colors rounded-none font-mono placeholder-[#555]"
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
                              {p.photo_url ? (
                                <img src={p.photo_url} alt="" className="w-6 h-6 object-cover border border-[#333] shrink-0" />
                              ) : (
                                <div className="w-6 h-6 bg-[#222] text-[10px] font-bold flex items-center justify-center text-white shrink-0">
                                  {p.name.charAt(0)}
                                </div>
                              )}
                              <span className="text-xs font-bold text-white font-mono">{p.name}</span>
                            </button>
                          ))
                      )}
                    </div>
                  )}
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
                  disabled={submitting || (!selectedPlayerId && !searchQuery.trim())}
                  className="w-full h-12 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-gray-200 active:opacity-60 transition-all rounded-none disabled:opacity-40"
                >
                  {submitting ? '...' : 'ENTER'}
                </button>
              </form>
            )}

            {/* New Player Sign Up / Join Profile Section */}
            <div className="pt-5 border-t border-[#222] text-center space-y-3 relative z-30">
              <p className="text-[10px] text-[#888] font-mono uppercase tracking-widest font-bold">
                New Player? Submit profile &amp; join a UWIFA team
              </p>
              <Link
                href="/join"
                className="w-full h-12 border-2 border-amber-400 bg-amber-400/20 hover:bg-amber-400 hover:text-black text-amber-400 font-extrabold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all rounded-none cursor-pointer active:scale-[0.98] select-none"
              >
                REGISTER / SUBMIT PROFILE →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Admin Link */}
      <div className="relative z-10 pb-4 text-center">
        <Link href="/login" className="text-[9px] text-[#555] hover:text-white font-mono uppercase tracking-widest transition-colors">
          ADMIN LOGIN →
        </Link>
      </div>

      <div className="relative z-10 w-full mt-4">
        <FooterPartnerTicker />
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
