'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PublicNav from '@/components/PublicNav'

interface Session {
  id: string
  date: string
  location: string
  notes?: string
}

export default function PublicCalendarPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/sessions')
      .then(res => res.json())
      .then(data => {
        // Sort sessions chronologically
        const sorted = (data.sessions || []).sort((a: Session, b: Session) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        setSessions(sorted)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const now = new Date()
  const upcoming = sessions.filter(s => new Date(s.date) > now)
  const nextSession = upcoming[0]
  const otherUpcoming = upcoming.slice(1)

  // Helpers for formatting
  const formatDateDay = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { weekday: 'long' })
  }
  
  const formatFullDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatShortTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      weekday: 'long', 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    })
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="flex flex-col items-center pt-12 pb-6 border-b border-[#1a1a1a] px-4">
        <Link href="/home">
          <img src="/logo_2.png" alt="The Circle FC" className="h-14 object-contain brightness-0 invert mb-4" />
        </Link>
        <h1 className="text-xl font-bold tracking-[0.2em] uppercase text-center">Schedule</h1>
      </div>

      <div className="page-content px-4 pt-6 space-y-8">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-[#111] border border-[#222]"></div>
            <div className="h-20 bg-[#111] border border-[#222]"></div>
            <div className="h-20 bg-[#111] border border-[#222]"></div>
          </div>
        ) : upcoming.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <p className="text-[#555] text-sm">No upcoming sessions scheduled.</p>
          </div>
        ) : (
          <>
            {/* Next Session Highlight */}
            {nextSession && (
              new Date(nextSession.date + 'T00:00:00').getDay() === 5 ? (
                <div className="flex justify-center mb-6">
                  <img src="/schedule_graphic.png" alt="Friday Ball" className="w-full max-w-[600px] h-auto object-contain" />
                </div>
              ) : (
                <div className="bg-[#111] border border-white p-5 text-center">
                  <p className="text-[10px] text-[#888] font-bold tracking-widest uppercase mb-3">Next Session</p>
                  <p className="text-2xl font-bold uppercase tracking-wide mb-1">
                    {formatDateDay(nextSession.date)}
                  </p>
                  <p className="text-[#aaa] text-sm tracking-widest uppercase mb-4">
                    {formatFullDateTime(nextSession.date)}
                  </p>
                  <div className="inline-flex items-center gap-2 bg-[#222] px-3 py-1.5 border border-[#333]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="text-xs font-bold tracking-wider uppercase">{nextSession.location}</span>
                  </div>
                  {nextSession.notes && (
                    <p className="text-[#666] text-xs mt-4 italic">{nextSession.notes}</p>
                  )}
                </div>
              )
            )}

            {/* Other Upcoming Sessions */}
            {otherUpcoming.length > 0 && (
              <div>
                <p className="text-[10px] text-[#555] font-bold tracking-widest uppercase mb-3 px-2">Later This Month</p>
                <div className="divide-y divide-[#1a1a1a] border border-[#1a1a1a] bg-[#0a0a0a]">
                  {otherUpcoming.map(session => (
                    <div key={session.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold uppercase tracking-wider mb-0.5">
                          {formatShortDate(session.date)}
                        </p>
                        <p className="text-[#666] text-xs">
                          {formatShortTime(session.date)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold tracking-wider uppercase text-[#aaa]">{session.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <PublicNav />
    </div>
  )
}
