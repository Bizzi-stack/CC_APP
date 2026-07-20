'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import PublicNav from '@/components/PublicNav'

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
  const today = new Date().toISOString().split('T')[0]

  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Check auth status
    fetch('/api/auth/status')
      .then(r => r.json())
      .then(data => setIsAdmin(data.isAdmin))
      .catch(() => {})

    // Fetch sessions
    fetch('/api/sessions')
      .then(r => r.json())
      .then(data => {
        const upcoming = (data.sessions || []).find((s: Session) => s.date >= today)
        setNextSession(upcoming || null)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    // Fetch pending count
    fetch('/api/players?status=pending')
      .then(r => r.json())
      .then(data => setPendingCount((data.players || []).length))
      .catch(() => {})
  }, [today])

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
            <Link href={isAdmin ? "/sessions" : "/calendar"}>
              <div className="border border-[#333] bg-[#0a0a0a] p-5 active:bg-[#111] transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 ${nextSession.type === '5v5_match' ? 'bg-white text-black' : 'border border-[#444] text-[#aaa]'}`}>
                    {nextSession.type === '5v5_match' ? '5v5 MATCH' : 'FREE SESSION'}
                  </span>
                </div>
                <p className="text-white font-semibold text-base mt-2">{nextSession.title}</p>
                <p className="text-[#888] text-sm mt-1">{formatDate(nextSession.date)} · {formatTime(nextSession.time)}</p>
                <p className="text-[#666] text-sm mt-0.5">{nextSession.location}</p>
              </div>
            </Link>
          ) : (
            <div className="border border-[#1a1a1a] p-5 text-center">
              <p className="text-[#555] text-sm">No upcoming sessions</p>
            </div>
          )}
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-xs text-[#555] font-bold tracking-widest uppercase mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href={isAdmin ? "/sessions" : "/calendar"} className="border border-[#222] p-5 flex flex-col gap-2 items-center justify-center text-center active:bg-[#111] transition-colors">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span className="text-white font-semibold text-sm">View Sessions</span>
              <span className="text-[#555] text-xs">All upcoming</span>
            </Link>

            <Link href={isAdmin ? "/players" : "/market"} className="border border-[#222] p-5 flex flex-col gap-2 items-center justify-center text-center active:bg-[#111] transition-colors relative">
              {isAdmin && pendingCount > 0 && (
                <div className="absolute top-3 right-3 bg-[#f44336] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                  {pendingCount} Pending
                </div>
              )}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
              <span className="text-white font-semibold text-sm">Player Market</span>
              <span className="text-[#555] text-xs">Transfer listed</span>
            </Link>

            {isAdmin && (
              <Link href="/badges" className="border border-[#222] p-5 flex flex-col gap-2 items-center justify-center text-center active:bg-[#111] transition-colors relative">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 15l-8-4.5V17a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 17v-6.5L12 15z"></path>
                  <path d="M12 15V3"></path>
                  <path d="M4 10.5L12 6l8 4.5"></path>
                </svg>
                <span className="text-white font-semibold text-sm">Badge Library</span>
                <span className="text-[#555] text-xs">Manage canvas</span>
              </Link>
            )}

            {!isAdmin && (
              <>
                <Link href="/join" className="border border-[#222] p-5 flex flex-col gap-2 items-center justify-center text-center active:bg-[#111] transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
                  </svg>
                  <span className="text-white font-semibold text-sm">Submit Profile</span>
                  <span className="text-[#555] text-xs">Join market</span>
                </Link>

                <Link href="/franchise-portal" className="border border-[#222] p-5 flex flex-col gap-2 items-center justify-center text-center active:bg-[#111] transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <span className="text-white font-semibold text-sm">Franchise Portal</span>
                  <span className="text-[#555] text-xs">Sign players</span>
                </Link>

                <Link href="/player-portal" className="border border-[#222] p-5 flex flex-col gap-2 items-center justify-center text-center active:bg-[#111] transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span className="text-white font-semibold text-sm">Player Portal</span>
                  <span className="text-[#555] text-xs">Collect wages</span>
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

      {isAdmin ? <BottomNav /> : <PublicNav />}
    </div>
  )
}
