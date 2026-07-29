'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import PublicNav from '@/components/PublicNav'
import BtcTicker from '@/components/BtcTicker'
import SessionGraphicModal from '@/components/SessionGraphicModal'

interface Session {
  id: string
  title: string
  type: 'free_session' | '5v5_match'
  date: string
  time: string
  location: string
  notes?: string
  max_players: number
  created_at: string
  image_url?: string
  has_team_selection?: boolean
  team_a_name?: string
  team_b_name?: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${m} ${ampm}`
}

export default function HomePage() {
  const [nextSession, setNextSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingCount, setPendingCount] = useState(0)
  const [showSessionModal, setShowSessionModal] = useState(false)

  const refetchSession = () => {
    const todayStr = new Date().toISOString().split('T')[0]
    fetch('/api/sessions')
      .then(r => r.json())
      .then(data => {
        const upcoming = (data.sessions || []).find((s: Session) => s.date >= todayStr)
        setNextSession(upcoming || null)
      })
      .catch(() => {})
  }

  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Check auth status
    fetch('/api/auth/status')
      .then(r => r.json())
      .then(data => setIsAdmin(data.isAdmin))
      .catch(() => {})

    // Fetch sessions
    const todayStr = new Date().toISOString().split('T')[0]
    fetch('/api/sessions')
      .then(r => r.json())
      .then(data => {
        const upcoming = (data.sessions || []).find((s: Session) => s.date >= todayStr)
        setNextSession(upcoming || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    // Fetch pending count
    fetch('/api/players?status=pending')
      .then(r => r.json())
      .then(data => setPendingCount((data.players || []).length))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="flex flex-col items-center pt-12 pb-6 border-b border-[#1a1a1a]">
        <Link href="/home">
          <img src="/logo_2.png" alt="The Circle FC" className="h-16 object-contain brightness-0 invert mb-2" />
        </Link>
        <p className="text-[#555] text-xs tracking-widest uppercase">Football Community</p>
      </div>

      <div className="page-content px-4 pt-6 space-y-8">
        {/* Next Session Banner */}
        <section>
          <h2 className="text-xs text-[#555] font-bold tracking-widest uppercase mb-3">Next Session</h2>
          {loading ? (
            <div className="border border-[#1a1a1a] rounded-none p-5 animate-pulse">
              <div className="h-4 w-32 bg-[#1a1a1a] mb-2 rounded" />
              <div className="h-3 w-48 bg-[#1a1a1a] rounded" />
            </div>
          ) : nextSession ? (
            <div
              onClick={() => setShowSessionModal(true)}
              className="cursor-pointer group active:scale-95 transition-all"
            >
              {nextSession.image_url ? (
                <div className="relative w-full max-w-[500px] mx-auto overflow-hidden bg-black flex justify-center">
                  <img src={nextSession.image_url} alt={nextSession.title} className="w-full h-auto object-contain group-hover:scale-105 transition-transform" />
                  <div className="absolute bottom-3 right-3 bg-black/85 backdrop-blur-md px-3 py-1 text-[10px] font-mono text-white border border-white/30 shadow font-bold flex items-center gap-1.5 uppercase">
                    <span>⚽</span>
                    <span>TAP TO JOIN TEAM</span>
                  </div>
                </div>
              ) : new Date(nextSession.date + 'T00:00:00').getDay() === 5 ? (
                <div className="relative w-full max-w-[500px] mx-auto overflow-hidden bg-black flex justify-center">
                  <img src="/schedule_graphic.png" alt="Friday Ball" className="w-full h-auto object-contain group-hover:scale-105 transition-transform" />
                  <div className="absolute bottom-3 right-3 bg-black/85 backdrop-blur-md px-3 py-1 text-[10px] font-mono text-white border border-white/30 shadow font-bold flex items-center gap-1.5 uppercase">
                    <span>⚽</span>
                    <span>TAP TO JOIN TEAM</span>
                  </div>
                </div>
              ) : (
                <div className="border border-[#222] bg-[#0a0a0a] p-5 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 ${nextSession.type === '5v5_match' ? 'bg-white text-black' : 'border border-[#444] text-[#aaa]'}`}>
                      {nextSession.type === '5v5_match' ? '5v5 MATCH' : 'FREE SESSION'}
                    </span>
                  </div>
                  <p className="text-white font-semibold text-base mt-2">{nextSession.title}</p>
                  <p className="text-[#888] text-sm mt-1">{formatDate(nextSession.date)} · {formatTime(nextSession.time)}</p>
                  <p className="text-[#666] text-sm mt-0.5">{nextSession.location}</p>
                  <p className="text-amber-400 text-xs font-bold uppercase mt-2">TAP TO JOIN TEAM →</p>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-[#1a1a1a] p-5 text-center">
              <p className="text-[#555] text-sm">No upcoming sessions</p>
            </div>
          )}
        </section>

        {/* Currency Exchange Value & BTC Spot Price Ticker */}
        <section className="relative overflow-hidden bg-[#08080a] border border-[#222] rounded-2xl p-5 shadow-xl text-center space-y-4">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-extrabold tracking-[0.25em] text-amber-400 uppercase flex items-center gap-1.5">
              <span>⚡</span> LEAGUE BTC CASHOUT RATE <span>⚡</span>
            </span>

            {/* Graphic Exchange Pill Container */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-1 py-3.5 px-5 bg-black border border-[#1f1f24] rounded-xl shadow-inner w-full">
              {/* CR side */}
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-mono font-black text-xl sm:text-2xl tracking-tight">
                  1,000,000
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  CR
                </span>
              </div>

              {/* Equals Arrow Badge */}
              <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 font-black text-xs shadow-md shrink-0">
                =
              </div>

              {/* USD Cash equivalent side */}
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-mono font-black text-xl sm:text-2xl tracking-tight">
                  $50.00
                </span>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                  in BTC
                </span>
              </div>
            </div>
            <BtcTicker showConversionHint={true} className="mt-1" />
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-xs text-[#555] font-bold tracking-widest uppercase mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* 1. View Sessions */}
            <Link href={isAdmin ? "/sessions" : "/calendar"} className="border border-[#222] p-5 flex flex-col gap-2 items-center justify-center text-center active:bg-[#111] transition-colors group">
              <div className="animate-icon-flicker">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <span className="text-white font-semibold text-sm">View Sessions</span>
              <span className="text-[#555] text-xs">All upcoming</span>
            </Link>

            {/* 2. Player Market */}
            <Link href={isAdmin ? "/players" : "/market"} className="border border-[#222] p-5 flex flex-col gap-2 items-center justify-center text-center active:bg-[#111] transition-colors relative group">
              {isAdmin && pendingCount > 0 && (
                <div className="absolute top-3 right-3 bg-[#f44336] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                  {pendingCount} Pending
                </div>
              )}
              <div className="animate-icon-flicker-delay-1">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <span className="text-white font-semibold text-sm">Player Market</span>
              <span className="text-[#555] text-xs">Transfer listed</span>
            </Link>

            {isAdmin && (
              <Link href="/badges" className="border border-[#222] p-5 flex flex-col gap-2 items-center justify-center text-center active:bg-[#111] transition-colors relative group">
                <div className="animate-icon-flicker-delay-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform">
                    <path d="M12 15l-8-4.5V17a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 17v-6.5L12 15z"></path>
                    <path d="M12 15V3"></path>
                    <path d="M4 10.5L12 6l8 4.5"></path>
                  </svg>
                </div>
                <span className="text-white font-semibold text-sm">Badge Library</span>
                <span className="text-[#555] text-xs">Manage canvas</span>
              </Link>
            )}

            {!isAdmin && (
              <>
                {/* 3. Submit Profile */}
                <Link href="/join" className="border border-[#222] p-5 flex flex-col gap-2 items-center justify-center text-center active:bg-[#111] transition-colors group">
                  <div className="animate-icon-flicker-delay-2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
                    </svg>
                  </div>
                  <span className="text-white font-semibold text-sm">Submit Profile</span>
                  <span className="text-[#555] text-xs">Join market</span>
                </Link>

                {/* 4. Franchise Portal */}
                <Link href="/franchise-portal" className="border border-[#222] p-5 flex flex-col gap-2 items-center justify-center text-center active:bg-[#111] transition-colors group">
                  <div className="animate-icon-flicker-delay-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                  <span className="text-white font-semibold text-sm">Franchise Portal</span>
                  <span className="text-[#555] text-xs">Sign players</span>
                </Link>

                {/* 5. Player Portal */}
                <Link href="/player-portal" className="border border-[#222] p-5 flex flex-col gap-2 items-center justify-center text-center active:bg-[#111] transition-colors group">
                  <div className="animate-icon-flicker">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <span className="text-white font-semibold text-sm">Player Portal</span>
                  <span className="text-[#555] text-xs">Collect wages</span>
                </Link>

                {/* 6. League & Stats */}
                <Link href="/league" className="border border-[#222] p-5 flex flex-col gap-2 items-center justify-center text-center active:bg-[#111] transition-colors group">
                  <div className="animate-icon-flicker-delay-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
                      <line x1="18" y1="20" x2="18" y2="10"/>
                      <line x1="12" y1="20" x2="12" y2="4"/>
                      <line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                  </div>
                  <span className="text-white font-semibold text-sm">League & Stats</span>
                  <span className="text-[#555] text-xs">Standings</span>
                </Link>
              </>
            )}

            {isAdmin && (
              <>
                <Link href="/sessions/new" className="border border-[#222] p-5 flex flex-col gap-2 items-center justify-center text-center active:bg-[#111] transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                  <span className="text-white font-semibold text-sm">Add Session</span>
                  <span className="text-[#555] text-xs">New fixture</span>
                </Link>

                <Link href="/players/new" className="border border-[#222] p-5 flex flex-col gap-2 items-center justify-center text-center active:bg-[#111] transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
                  </svg>
                  <span className="text-white font-semibold text-sm">Add Player</span>
                  <span className="text-[#555] text-xs">Transfer market</span>
                </Link>

                <Link href="/franchises" className="border border-[#222] p-5 flex flex-col gap-2 items-center justify-center text-center active:bg-[#111] transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <span className="text-white font-semibold text-sm">Manage Teams</span>
                  <span className="text-[#555] text-xs">Franchises</span>
                </Link>

                <Link href="/players/bids" className="border border-[#222] p-5 flex flex-col gap-2 items-center justify-center text-center active:bg-[#111] transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                  <span className="text-white font-semibold text-sm">Transfer Bids</span>
                  <span className="text-[#555] text-xs">Manage offers</span>
                </Link>

                <Link href="/league" className="border border-[#222] p-5 flex flex-col gap-2 items-center justify-center text-center active:bg-[#111] transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                  <span className="text-white font-semibold text-sm">League & Stats</span>
                  <span className="text-[#555] text-xs">Standings</span>
                </Link>

                <Link href="/admin-stats" className="border border-[#222] p-5 flex flex-col gap-2 items-center justify-center text-center active:bg-[#111] transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20v-6M6 20V10M18 20V4"/>
                  </svg>
                  <span className="text-white font-semibold text-sm">Update Stats</span>
                  <span className="text-[#555] text-xs">Admin tool</span>
                </Link>
              </>
            )}
          </div>
        </section>

        {!isAdmin && (
          <div className="flex justify-center pt-8 pb-4">
            <Link href="/login" className="text-[#555] text-[10px] font-bold tracking-widest uppercase hover:text-white transition-colors">
              Admin Escalation
            </Link>
          </div>
        )}
      </div>

      {/* Interactive Session Poster & Team Selection Modal */}
      {showSessionModal && nextSession && (
        <SessionGraphicModal
          session={nextSession}
          onClose={() => setShowSessionModal(false)}
          onSignupSuccess={refetchSession}
        />
      )}

      {isAdmin ? <BottomNav /> : <PublicNav />}
    </div>
  )
}
