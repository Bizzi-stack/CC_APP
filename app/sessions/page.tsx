'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

interface Signup {
  id: string
  session_id: string
  player_id: string
  selected_team: string
  player?: {
    id: string
    name: string
    photo_url?: string
    position?: string
  }
}

interface Session {
  id: string
  title: string
  type: 'free_session' | '5v5_match'
  date: string
  time: string
  location: string
  notes?: string
  max_players: number
  image_url?: string
  has_team_selection?: boolean
  team_a_name?: string
  team_b_name?: string
  signups?: Signup[]
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

  // Selected session for graphic modal
  const [activeModalSession, setActiveModalSession] = useState<Session | null>(null)
  const [userPlayer, setUserPlayer] = useState<any | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<string>('Red Team')
  const [signingUp, setSigningUp] = useState(false)

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

  useEffect(() => {
    fetchSessions()
    // Fetch logged in player profile
    fetch('/api/player/me')
      .then(r => r.json())
      .then(data => {
        if (data.player) setUserPlayer(data.player)
      })
      .catch(() => {})
  }, [])

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

  const handleJoinTeam = async (sessionId: string, teamName: string) => {
    setSigningUp(true)
    try {
      const res = await fetch('/api/sessions/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          player_id: userPlayer?.id,
          selected_team: teamName
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to join team')

      // Refresh sessions
      fetchSessions()

      // Update local modal session state
      if (activeModalSession) {
        const updatedSignups = [...(activeModalSession.signups || []).filter(s => s.player_id !== userPlayer?.id)]
        updatedSignups.push({
          id: data.signup?.id || Date.now().toString(),
          session_id: sessionId,
          player_id: userPlayer?.id || 'me',
          selected_team: teamName,
          player: userPlayer
        })
        setActiveModalSession({ ...activeModalSession, signups: updatedSignups })
      }
    } catch (err: any) {
      alert(err.message || 'Error joining team')
    } finally {
      setSigningUp(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-[#1a1a1a]">
        <h1 className="text-lg font-bold tracking-wide uppercase">Sessions & Match Flyers</h1>
        <Link href="/sessions/new" className="bg-gradient-to-r from-amber-500 to-amber-400 text-black text-xs font-black tracking-widest uppercase px-4 py-2 rounded-xl active:scale-95 transition-all shadow-md">
          + Add Event
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
            {f === 'all' ? 'All Events' : f === 'free_session' ? 'Free Pickup' : '5v5 Match'}
          </button>
        ))}
      </div>

      <div className="page-content max-w-2xl mx-auto px-4 pt-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl h-48" />
            ))}
          </div>
        ) : (
          <>
            {upcoming.length === 0 && past.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 px-6 text-center border border-[#1c1c1c] rounded-2xl bg-[#080808]">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" className="mb-4">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p className="text-[#666] text-xs font-mono uppercase">No upcoming event flyers posted yet</p>
                <Link href="/sessions/new" className="mt-3 text-amber-400 text-xs font-bold uppercase underline">Schedule an Event & Add Graphic →</Link>
              </div>
            ) : (
              <div className="space-y-6">
                {upcoming.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-400 tracking-widest uppercase flex items-center gap-1.5">
                        <span>🔥</span> Upcoming Match Posters ({upcoming.length})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {upcoming.map(session => (
                        <EventGraphicCard
                          key={session.id}
                          session={session}
                          onOpenModal={() => {
                            setActiveModalSession(session)
                            setSelectedTeam(session.team_a_name || 'Red Team')
                          }}
                          onDelete={handleDelete}
                          deleting={deleting}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {past.length > 0 && (
                  <div className="space-y-4 pt-6 border-t border-[#1a1a1a]">
                    <span className="text-xs font-bold text-[#666] tracking-widest uppercase block">
                      Past Events ({past.length})
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
                      {past.slice().reverse().map(session => (
                        <EventGraphicCard
                          key={session.id}
                          session={session}
                          onOpenModal={() => setActiveModalSession(session)}
                          onDelete={handleDelete}
                          deleting={deleting}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Interactive Event Graphic & Team Signup Modal */}
      {activeModalSession && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
          onClick={() => setActiveModalSession(null)}
        >
          <div
            className="relative w-full max-w-lg bg-[#0a0a0c] border border-amber-500/40 p-6 rounded-2xl shadow-2xl space-y-4 text-left max-h-[90vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#222] pb-3 shrink-0">
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wide flex items-center gap-2">
                  <span>⚽</span> {activeModalSession.title}
                </h3>
                <p className="text-[10px] text-[#888] font-mono">
                  {formatDate(activeModalSession.date)} · {formatTime(activeModalSession.time)} @ {activeModalSession.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalSession(null)}
                className="w-8 h-8 rounded-full bg-[#1c1c1c] text-[#aaa] hover:text-white flex items-center justify-center text-xs font-bold shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1 custom-scrollbar">
              {/* Event Graphic Poster */}
              {activeModalSession.image_url ? (
                <div className="relative w-full h-64 rounded-xl overflow-hidden border border-[#333] shadow-lg bg-black">
                  <img src={activeModalSession.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-32 rounded-xl border border-dashed border-[#333] bg-[#0c0c0e] flex items-center justify-center text-[#555] text-xs font-mono uppercase">
                  No graphic poster uploaded
                </div>
              )}

              {/* Event Details */}
              {activeModalSession.notes && (
                <div className="bg-[#111] border border-[#222] p-3 rounded-xl text-xs text-[#ccc] leading-relaxed">
                  <span className="text-[9px] text-[#666] font-mono uppercase block mb-1">Event Info:</span>
                  {activeModalSession.notes}
                </div>
              )}

              {/* Team Selection Section */}
              {activeModalSession.has_team_selection && (
                <div className="bg-black border border-amber-500/30 p-4 rounded-xl space-y-3 text-center">
                  <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                    Select Your Team For Friday
                  </h4>
                  <p className="text-[10px] text-[#888] font-mono">
                    Pick your squad below to get rostered & earn match credits
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      disabled={signingUp}
                      onClick={() => handleJoinTeam(activeModalSession.id, activeModalSession.team_a_name || 'Red Team')}
                      className="h-12 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-none transition-all active:scale-95 flex items-center justify-center gap-2 border border-white"
                    >
                      <img src="/red_team.png" alt="Red Team" className="w-6 h-6 object-contain shrink-0" />
                      <span>Join {activeModalSession.team_a_name || 'Red Team'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={signingUp}
                      onClick={() => handleJoinTeam(activeModalSession.id, activeModalSession.team_b_name || 'Blue Team')}
                      className="h-12 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-none transition-all active:scale-95 flex items-center justify-center gap-2 border border-white"
                    >
                      <img src="/blue_team.png" alt="Blue Team" className="w-6 h-6 object-contain shrink-0" />
                      <span>Join {activeModalSession.team_b_name || 'Blue Team'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Registered Team Rosters */}
              <div className="space-y-3 border-t border-[#333] pt-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                  <span>👥 Event Rosters</span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {(activeModalSession.signups || []).length} Signed Up
                  </span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  {/* Team A Roster */}
                  <div className="bg-[#0c0c0e] border border-red-500/30 p-3 rounded-none space-y-2 text-left">
                    <h5 className="text-[11px] font-bold text-red-400 uppercase tracking-wide border-b border-red-500/20 pb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <img src="/red_team.png" alt="" className="w-4 h-4 object-contain shrink-0" />
                        <span>{activeModalSession.team_a_name || 'Red Team'}</span>
                      </span>
                      <span className="text-[9px] font-mono text-[#888]">
                        {(activeModalSession.signups || []).filter(s => s.selected_team === (activeModalSession.team_a_name || 'Red Team')).length}
                      </span>
                    </h5>
                    <div className="space-y-1">
                      {(activeModalSession.signups || [])
                        .filter(s => s.selected_team === (activeModalSession.team_a_name || 'Red Team'))
                        .map(s => (
                          <div key={s.id} className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                            <span>⚽</span>
                            <span className="truncate">{s.player?.name || 'Player'}</span>
                          </div>
                        ))}
                      {(activeModalSession.signups || []).filter(s => s.selected_team === (activeModalSession.team_a_name || 'Red Team')).length === 0 && (
                        <p className="text-[9px] text-[#555] font-mono italic">No players yet</p>
                      )}
                    </div>
                  </div>

                  {/* Team B Roster */}
                  <div className="bg-[#0c0c0e] border border-blue-500/30 p-3 rounded-none space-y-2 text-left">
                    <h5 className="text-[11px] font-bold text-blue-400 uppercase tracking-wide border-b border-blue-500/20 pb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <img src="/blue_team.png" alt="" className="w-4 h-4 object-contain shrink-0" />
                        <span>{activeModalSession.team_b_name || 'Blue Team'}</span>
                      </span>
                      <span className="text-[9px] font-mono text-[#888]">
                        {(activeModalSession.signups || []).filter(s => s.selected_team === (activeModalSession.team_b_name || 'Blue Team')).length}
                      </span>
                    </h5>
                    <div className="space-y-1">
                      {(activeModalSession.signups || [])
                        .filter(s => s.selected_team === (activeModalSession.team_b_name || 'Blue Team'))
                        .map(s => (
                          <div key={s.id} className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                            <span>⚽</span>
                            <span className="truncate">{s.player?.name || 'Player'}</span>
                          </div>
                        ))}
                      {(activeModalSession.signups || []).filter(s => s.selected_team === (activeModalSession.team_b_name || 'Blue Team')).length === 0 && (
                        <p className="text-[9px] text-[#555] font-mono italic">No players yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}

function EventGraphicCard({ session, onOpenModal, onDelete, deleting }: {
  session: Session
  onOpenModal: () => void
  onDelete: (id: string) => void
  deleting: string | null
}) {
  const { id, title, type, date, time, location, image_url, signups } = session
  const signupCount = (signups || []).length

  return (
    <div className="bg-[#0a0a0c] border border-[#222] hover:border-amber-500/40 rounded-2xl overflow-hidden shadow-xl transition-all group text-left">
      {/* Poster Graphic Container */}
      <div
        onClick={onOpenModal}
        className="relative w-full h-52 bg-black cursor-pointer overflow-hidden group-hover:brightness-110 transition-all"
      >
        {image_url ? (
          <img src={image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#18181c] to-[#08080a] flex flex-col items-center justify-center p-4 text-center">
            <span className="text-3xl mb-2">⚽</span>
            <span className="text-xs font-black text-white uppercase tracking-wider">{title}</span>
            <span className="text-[9px] text-amber-400 font-mono mt-1">Tap to view event details & pick team</span>
          </div>
        )}

        {/* Overlay Overlay Pill */}
        <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md border border-[#333] px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold text-white uppercase flex items-center gap-1.5 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>{type === '5v5_match' ? '5v5 Match' : 'Pickup Match'}</span>
        </div>

        <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md border border-emerald-500/30 px-2.5 py-1 rounded-lg text-[9px] font-mono font-bold text-emerald-400 shadow-lg">
          👥 {signupCount} Registered
        </div>

        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3 flex items-end justify-between">
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wide group-hover:text-amber-300 transition-colors">
              {title}
            </h4>
            <p className="text-[10px] text-[#aaa] font-mono">
              {formatDate(date)} · {formatTime(time)}
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-[#0d0d0f] flex items-center justify-between border-t border-[#1c1c1c]">
        <div className="text-[10px] text-[#888] font-mono truncate max-w-[70%]">
          📍 {location}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenModal}
            className="h-8 px-3 bg-amber-500/10 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-amber-500/20 active:scale-95 transition-all"
          >
            Join Team
          </button>

          <button
            onClick={() => onDelete(id)}
            disabled={deleting === id}
            className="text-[#555] hover:text-red-500 transition-colors p-1 disabled:opacity-30"
            title="Delete Session"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
