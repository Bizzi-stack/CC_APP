'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

interface Session {
  id: string
  title: string
  type: 'free_session' | '5v5_match'
  date: string
  time: string
  location: string
  notes?: string
  max_players: number
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${m} ${ampm}`
}

type FilterType = 'all' | 'free_session' | '5v5_match'

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [deleting, setDeleting] = useState<string | null>(null)
  const today = new Date().toISOString().split('T')[0]

  const fetchSessions = () => {
    setLoading(true)
    fetch('/api/sessions')
      .then(r => r.json())
      .then(data => {
        setSessions(data.sessions || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchSessions() }, [])

  const filtered = sessions.filter(s => filter === 'all' || s.type === filter)
  const upcoming = filtered.filter(s => s.date >= today)
  const past = filtered.filter(s => s.date < today)

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this session?')) return
    setDeleting(id)
    await fetch(`/api/sessions?id=${id}`, { method: 'DELETE' })
    fetchSessions()
    setDeleting(null)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-[#1a1a1a]">
        <h1 className="text-lg font-bold tracking-wide uppercase">Sessions</h1>
        <Link href="/sessions/new" className="bg-white text-black text-xs font-bold tracking-widest uppercase px-4 py-2 active:bg-gray-200 transition-colors">
          + Add
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-[#1a1a1a]">
        {(['all', 'free_session', '5v5_match'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-3 text-[11px] font-bold tracking-widest uppercase transition-colors ${filter === f ? 'text-white border-b-2 border-white' : 'text-[#555]'}`}
          >
            {f === 'all' ? 'All' : f === 'free_session' ? 'Free' : '5v5'}
          </button>
        ))}
      </div>

      <div className="page-content">
        {loading ? (
          <div className="space-y-px pt-px">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-[#0a0a0a] border-b border-[#1a1a1a] p-5">
                <div className="h-3 w-20 bg-[#1a1a1a] mb-3 rounded" />
                <div className="h-4 w-40 bg-[#1a1a1a] mb-2 rounded" />
                <div className="h-3 w-32 bg-[#1a1a1a] rounded" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {upcoming.length === 0 && past.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" className="mb-4">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p className="text-[#555] text-sm">No sessions yet</p>
                <Link href="/sessions/new" className="mt-3 text-white text-sm underline">Schedule one →</Link>
              </div>
            ) : (
              <div>
                {upcoming.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-[#0a0a0a]">
                      <span className="text-[10px] text-[#555] font-bold tracking-widest uppercase">Upcoming</span>
                    </div>
                    <div className="divide-y divide-[#1a1a1a]">
                      {upcoming.map(session => (
                        <SessionRow key={session.id} session={session} onDelete={handleDelete} deleting={deleting} />
                      ))}
                    </div>
                  </div>
                )}
                {past.length > 0 && (
                  <div className="mt-2">
                    <div className="px-4 py-2 bg-[#0a0a0a]">
                      <span className="text-[10px] text-[#555] font-bold tracking-widest uppercase">Past</span>
                    </div>
                    <div className="divide-y divide-[#1a1a1a] opacity-50">
                      {past.slice().reverse().map(session => (
                        <SessionRow key={session.id} session={session} onDelete={handleDelete} deleting={deleting} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

function SessionRow({ session, onDelete, deleting }: {
  session: Session
  onDelete: (id: string) => void
  deleting: string | null
}) {
  const { id, title, type, date, time, location, notes, max_players } = session
  return (
    <div className="px-4 py-4 bg-black flex gap-3 items-start">
      {/* Date Block */}
      <div className="flex-shrink-0 w-12 text-center border border-[#222] py-1">
        <div className="text-[10px] text-[#666] uppercase">{new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}</div>
        <div className="text-white font-bold text-lg leading-none">{new Date(date + 'T00:00:00').getDate()}</div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 ${type === '5v5_match' ? 'bg-white text-black' : 'border border-[#444] text-[#888]'}`}>
            {type === '5v5_match' ? '5v5' : 'Free'}
          </span>
          <span className="text-[10px] text-[#666]">Max {max_players}</span>
        </div>
        <p className="text-white font-semibold text-sm truncate">{title}</p>
        <p className="text-[#888] text-xs mt-0.5">{formatDate(date)}</p>
        <p className="text-[#666] text-xs">{formatTime(time)} · {location}</p>
        {notes && <p className="text-[#555] text-xs mt-1 italic">{notes}</p>}
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(id)}
        disabled={deleting === id}
        className="flex-shrink-0 text-[#444] hover:text-red-500 transition-colors p-1 disabled:opacity-30"
        aria-label="Delete session"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
      </button>
    </div>
  )
}
