'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PublicNav from '@/components/PublicNav'
import SessionGraphicModal from '@/components/SessionGraphicModal'

interface Session {
  id: string
  date: string
  location: string
  notes?: string
}

interface TournamentMatch {
  id: string
  matchDay: 1 | 2 | 3
  time: string
  pitch: string
  pitchSide: 'LEFT SIDE' | 'RIGHT SIDE'
  group: 'Group A' | 'Group B'
  teamA: string
  teamALogo: string
  teamB: string
  teamBLogo: string
}

const GROUPS_DATA = {
  'Group A': [
    { name: 'England', logo: '/uwifa_teams/england.webp' },
    { name: 'Mexico', logo: '/uwifa_teams/mexico.webp' },
    { name: 'France', logo: '/uwifa_teams/france.webp' },
    { name: 'Spain', logo: '/uwifa_teams/spain.webp' }
  ],
  'Group B': [
    { name: 'Argentina', logo: '/uwifa_teams/argentina.webp' },
    { name: 'Brazil', logo: '/uwifa_teams/brazil.webp' },
    { name: 'Germany', logo: '/uwifa_teams/germany.webp' },
    { name: 'Portugal', logo: '/uwifa_teams/portugal.webp' }
  ]
}

const TOURNAMENT_FIXTURES: TournamentMatch[] = [
  // Match Day 1
  {
    id: 'md1-1',
    matchDay: 1,
    time: '5:00 PM',
    pitch: 'Pitch A',
    pitchSide: 'LEFT SIDE',
    group: 'Group A',
    teamA: 'England',
    teamALogo: '/uwifa_teams/england.webp',
    teamB: 'France',
    teamBLogo: '/uwifa_teams/france.webp'
  },
  {
    id: 'md1-2',
    matchDay: 1,
    time: '5:00 PM',
    pitch: 'Pitch B',
    pitchSide: 'RIGHT SIDE',
    group: 'Group B',
    teamA: 'Argentina',
    teamALogo: '/uwifa_teams/argentina.webp',
    teamB: 'Portugal',
    teamBLogo: '/uwifa_teams/portugal.webp'
  },
  {
    id: 'md1-3',
    matchDay: 1,
    time: '6:00 PM',
    pitch: 'Pitch A',
    pitchSide: 'LEFT SIDE',
    group: 'Group A',
    teamA: 'Mexico',
    teamALogo: '/uwifa_teams/mexico.webp',
    teamB: 'Spain',
    teamBLogo: '/uwifa_teams/spain.webp'
  },
  {
    id: 'md1-4',
    matchDay: 1,
    time: '6:00 PM',
    pitch: 'Pitch B',
    pitchSide: 'RIGHT SIDE',
    group: 'Group B',
    teamA: 'Brazil',
    teamALogo: '/uwifa_teams/brazil.webp',
    teamB: 'Germany',
    teamBLogo: '/uwifa_teams/germany.webp'
  },

  // Match Day 2
  {
    id: 'md2-1',
    matchDay: 2,
    time: '5:00 PM',
    pitch: 'Pitch A',
    pitchSide: 'LEFT SIDE',
    group: 'Group A',
    teamA: 'France',
    teamALogo: '/uwifa_teams/france.webp',
    teamB: 'Spain',
    teamBLogo: '/uwifa_teams/spain.webp'
  },
  {
    id: 'md2-2',
    matchDay: 2,
    time: '5:00 PM',
    pitch: 'Pitch B',
    pitchSide: 'RIGHT SIDE',
    group: 'Group B',
    teamA: 'Brazil',
    teamALogo: '/uwifa_teams/brazil.webp',
    teamB: 'Portugal',
    teamBLogo: '/uwifa_teams/portugal.webp'
  },
  {
    id: 'md2-3',
    matchDay: 2,
    time: '6:00 PM',
    pitch: 'Pitch A',
    pitchSide: 'LEFT SIDE',
    group: 'Group A',
    teamA: 'England',
    teamALogo: '/uwifa_teams/england.webp',
    teamB: 'Mexico',
    teamBLogo: '/uwifa_teams/mexico.webp'
  },
  {
    id: 'md2-4',
    matchDay: 2,
    time: '6:00 PM',
    pitch: 'Pitch B',
    pitchSide: 'RIGHT SIDE',
    group: 'Group B',
    teamA: 'Argentina',
    teamALogo: '/uwifa_teams/argentina.webp',
    teamB: 'Germany',
    teamBLogo: '/uwifa_teams/germany.webp'
  },

  // Match Day 3
  {
    id: 'md3-1',
    matchDay: 3,
    time: '5:00 PM',
    pitch: 'Pitch A',
    pitchSide: 'LEFT SIDE',
    group: 'Group A',
    teamA: 'Mexico',
    teamALogo: '/uwifa_teams/mexico.webp',
    teamB: 'France',
    teamBLogo: '/uwifa_teams/france.webp'
  },
  {
    id: 'md3-2',
    matchDay: 3,
    time: '5:00 PM',
    pitch: 'Pitch B',
    pitchSide: 'RIGHT SIDE',
    group: 'Group B',
    teamA: 'Argentina',
    teamALogo: '/uwifa_teams/argentina.webp',
    teamB: 'Brazil',
    teamBLogo: '/uwifa_teams/brazil.webp'
  },
  {
    id: 'md3-3',
    matchDay: 3,
    time: '6:00 PM',
    pitch: 'Pitch A',
    pitchSide: 'LEFT SIDE',
    group: 'Group A',
    teamA: 'England',
    teamALogo: '/uwifa_teams/england.webp',
    teamB: 'Spain',
    teamBLogo: '/uwifa_teams/spain.webp'
  },
  {
    id: 'md3-4',
    matchDay: 3,
    time: '6:00 PM',
    pitch: 'Pitch B',
    pitchSide: 'RIGHT SIDE',
    group: 'Group B',
    teamA: 'Germany',
    teamALogo: '/uwifa_teams/germany.webp',
    teamB: 'Portugal',
    teamBLogo: '/uwifa_teams/portugal.webp'
  }
]

export default function PublicCalendarPage() {
  const [activeTab, setActiveTab] = useState<'fixtures' | 'groups' | 'sessions'>('fixtures')
  const [selectedMatchDay, setSelectedMatchDay] = useState<number | 'ALL'>('ALL')
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<'ALL' | 'Group A' | 'Group B'>('ALL')
  
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<any | null>(null)

  useEffect(() => {
    fetch('/api/sessions')
      .then(res => res.json())
      .then(data => {
        const sorted = (data.sessions || []).sort((a: Session, b: Session) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        setSessions(sorted)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filteredFixtures = TOURNAMENT_FIXTURES.filter(match => {
    const matchDayOk = selectedMatchDay === 'ALL' || match.matchDay === selectedMatchDay
    const groupOk = selectedGroupFilter === 'ALL' || match.group === selectedGroupFilter
    return matchDayOk && groupOk
  })

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="flex flex-col items-center pt-12 pb-4 border-b border-[#1a1a1a] px-4">
        <Link href="/home" className="flex items-center gap-2 mb-3">
          <img src="/logo.png" alt="College Clubs" className="h-14 object-contain brightness-0 invert" />
          <span className="text-lg font-black uppercase tracking-wider text-white">College Clubs</span>
        </Link>
        <h1 className="text-xl font-bold tracking-[0.2em] uppercase text-center">Tournament Schedule</h1>
        <p className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest mt-1">Official Group Stage & Pitch Allocations</p>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-[#222] bg-[#0a0a0a] sticky top-0 z-20">
        {[
          { id: 'fixtures', label: 'Match Schedule' },
          { id: 'groups', label: 'Tournament Groups' },
          { id: 'sessions', label: 'Open Sessions' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 text-[10px] font-extrabold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === tab.id
                ? 'text-white border-amber-400 bg-black'
                : 'text-[#666] border-transparent hover:text-[#aaa]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="page-content max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* ================= TAB 1: FIXTURES SCHEDULE ================= */}
        {activeTab === 'fixtures' && (
          <div className="space-y-5">
            {/* Filter Controls */}
            <div className="bg-[#0e0e0e] border border-[#222] p-3 rounded-2xl space-y-3 shadow-lg">
              {/* Match Day Selector */}
              <div>
                <span className="text-[9px] font-extrabold text-[#777] uppercase tracking-wider block mb-1.5">Select Match Day</span>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: 'ALL', label: 'All Match Days' },
                    { id: 1, label: 'Match Day 1' },
                    { id: 2, label: 'Match Day 2' },
                    { id: 3, label: 'Match Day 3' }
                  ].map(md => (
                    <button
                      key={md.id.toString()}
                      onClick={() => setSelectedMatchDay(md.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase whitespace-nowrap transition-all ${
                        selectedMatchDay === md.id
                          ? 'bg-amber-400 text-black shadow-md'
                          : 'bg-[#181818] text-[#888] hover:text-white border border-[#262626]'
                      }`}
                    >
                      {md.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Group Filter */}
              <div className="pt-2 border-t border-[#1a1a1a] flex items-center justify-between">
                <span className="text-[9px] font-extrabold text-[#777] uppercase tracking-wider">Group Filter</span>
                <div className="flex gap-1.5">
                  {(['ALL', 'Group A', 'Group B'] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => setSelectedGroupFilter(g)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        selectedGroupFilter === g
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-[#161616] text-[#777] border border-[#222]'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Fixtures List */}
            <div className="space-y-4">
              {[1, 2, 3].map(day => {
                if (selectedMatchDay !== 'ALL' && selectedMatchDay !== day) return null
                const dayMatches = filteredFixtures.filter(m => m.matchDay === day)
                if (dayMatches.length === 0) return null

                return (
                  <div key={day} className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#222] pb-1">
                      <h2 className="text-xs font-extrabold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                        <span>🗓️</span> MATCH DAY {day}
                      </h2>
                      <span className="text-[10px] text-[#666] font-mono font-bold">{dayMatches.length} Matches</span>
                    </div>

                    <div className="grid gap-3">
                      {dayMatches.map(match => (
                        <div
                          key={match.id}
                          className="bg-[#0b0b0b] border border-[#222] hover:border-amber-500/40 rounded-2xl p-4 transition-all shadow-md space-y-3"
                        >
                          {/* Match Header Badges */}
                          <div className="flex items-center justify-between text-[10px] font-extrabold border-b border-[#181818] pb-2">
                            <div className="flex items-center gap-2">
                              <span className="bg-amber-400 text-black px-2 py-0.5 rounded font-black font-mono">
                                {match.time}
                              </span>
                              <span className="text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded uppercase">
                                {match.group}
                              </span>
                            </div>
                            <span className="text-emerald-400 font-mono tracking-wider bg-emerald-950/30 border border-emerald-500/30 px-2 py-0.5 rounded uppercase">
                              {match.pitch} ({match.pitchSide})
                            </span>
                          </div>

                          {/* Teams Matchup Box */}
                          <div className="grid grid-cols-7 items-center text-center py-1">
                            {/* Team A */}
                            <div className="col-span-3 flex flex-col items-center justify-center space-y-1.5">
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-black border border-[#333] p-1 shadow-md flex items-center justify-center">
                                <img src={match.teamALogo} alt={match.teamA} className="w-full h-full object-contain" />
                              </div>
                              <span className="text-xs font-bold text-white uppercase tracking-wider">{match.teamA}</span>
                            </div>

                            {/* VS Badge */}
                            <div className="col-span-1 flex flex-col items-center justify-center">
                              <span className="text-[10px] font-black text-[#555] bg-[#141414] border border-[#262626] px-2 py-1 rounded-full uppercase">
                                VS
                              </span>
                            </div>

                            {/* Team B */}
                            <div className="col-span-3 flex flex-col items-center justify-center space-y-1.5">
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-black border border-[#333] p-1 shadow-md flex items-center justify-center">
                                <img src={match.teamBLogo} alt={match.teamB} className="w-full h-full object-contain" />
                              </div>
                              <span className="text-xs font-bold text-white uppercase tracking-wider">{match.teamB}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 2: GROUPS OVERVIEW ================= */}
        {activeTab === 'groups' && (
          <div className="space-y-6">
            <div className="text-center bg-[#0d0d0d] border border-[#222] p-4 rounded-2xl">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Tournament Group Standings</h2>
              <p className="text-[11px] text-[#777] mt-1">Official team placements for Group A and Group B</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Group A Card */}
              <div className="bg-[#0b0b0b] border border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-[#222] pb-2">
                  <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest">GROUP A</h3>
                  <span className="text-[10px] text-[#666] uppercase font-bold">4 Teams</span>
                </div>
                <div className="space-y-2">
                  {GROUPS_DATA['Group A'].map((team, idx) => (
                    <div key={team.name} className="bg-black border border-[#222] p-3 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono font-bold text-[#555]">#{idx + 1}</span>
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-[#111] border border-[#333] p-0.5 shrink-0">
                          <img src={team.logo} alt={team.name} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-xs font-bold text-white uppercase">{team.name}</span>
                      </div>
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                        Group A
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Group B Card */}
              <div className="bg-[#0b0b0b] border border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-[#222] pb-2">
                  <h3 className="text-xs font-black text-amber-400 uppercase tracking-widest">GROUP B</h3>
                  <span className="text-[10px] text-[#666] uppercase font-bold">4 Teams</span>
                </div>
                <div className="space-y-2">
                  {GROUPS_DATA['Group B'].map((team, idx) => (
                    <div key={team.name} className="bg-black border border-[#222] p-3 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-mono font-bold text-[#555]">#{idx + 1}</span>
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-[#111] border border-[#333] p-0.5 shrink-0">
                          <img src={team.logo} alt={team.name} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-xs font-bold text-white uppercase">{team.name}</span>
                      </div>
                      <span className="text-[9px] font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                        Group B
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: OPEN SESSIONS ================= */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-32 bg-[#111] border border-[#222]" />
                <div className="h-20 bg-[#111] border border-[#222]" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <p className="text-[#555] text-sm">No open field sessions scheduled.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map(session => (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className="bg-[#0b0b0b] border border-[#222] hover:border-amber-400 p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all active:scale-95"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-1">
                        {session.date}
                      </span>
                      <p className="text-sm font-bold text-white uppercase">{session.location}</p>
                      {session.notes && <p className="text-xs text-[#777] mt-1">{session.notes}</p>}
                    </div>
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl uppercase">
                      Join →
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Session Graphic Poster & Team Selection Modal */}
      {selectedSession && (
        <SessionGraphicModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onSignupSuccess={() => {
            fetch('/api/sessions')
              .then(res => res.json())
              .then(data => setSessions(data.sessions || []))
              .catch(() => {})
          }}
        />
      )}

      <PublicNav />
    </div>
  )
}
