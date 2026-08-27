'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import PublicNav from '@/components/PublicNav'
import FooterPartnerTicker from '@/components/FooterPartnerTicker'
import { FANTASY_SLOTS, FantasySlot, FormationType, getSlotsForFormation, calculatePlayerPoints } from '@/lib/fantasy'

interface Player {
  id: string
  name: string
  position?: string
  photo_url?: string
  country?: string
  goals?: number
  assists?: number
  franchise_id?: string
  franchises?: {
    id: string
    name: string
    logo_url?: string
  } | null
  fantasy_points?: number
  stats?: {
    goals?: number
    assists?: number
    clean_sheet?: boolean
    minutes_played?: number
    bonus_points?: number
  }
}

interface PickSlot {
  slotId: string
  label: string
  positionType: 'GK' | 'DEF' | 'MID' | 'FWD' | 'FLEX'
  isStarter: boolean
  player: Player | null
  isCaptain: boolean
  isViceCaptain: boolean
  computedPoints: number
}

interface LeaderboardEntry {
  rank: number
  team_id: string
  user_identifier: string
  team_name: string
  manager_name: string
  gameweek_points: number
  total_points: number
}

export default function FantasyPage() {
  const [activeTab, setActiveTab] = useState<'pitch' | 'transfers' | 'leaderboard' | 'rules'>('pitch')
  const [gameweek, setGameweek] = useState<number>(1)
  const [gameweeksList, setGameweeksList] = useState<any[]>([])
  
  // Manager Identity, Team & Formation
  const [userIdentifier, setUserIdentifier] = useState<string>('')
  const [teamName, setTeamName] = useState<string>('')
  const [managerName, setManagerName] = useState<string>('')
  const [formation, setFormation] = useState<FormationType>('2-2-2')
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Data
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [squadPicks, setSquadPicks] = useState<{ [slotId: string]: { playerId: string; isCaptain: boolean; isViceCaptain: boolean } }>({})
  const [leaderboardData, setLeaderboardData] = useState<{
    average_score: number
    highest_score: number
    total_managers: number
    user_stats: any
    leaderboard: LeaderboardEntry[]
  }>({
    average_score: 0,
    highest_score: 0,
    total_managers: 0,
    user_stats: null,
    leaderboard: []
  })

  // Transfer / Player Selection Drawer State
  const [activePickingSlot, setActivePickingSlot] = useState<FantasySlot | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('ALL')
  const [selectedPosFilter, setSelectedPosFilter] = useState('ALL')

  // Modals
  const [inspectingPlayer, setInspectingPlayer] = useState<Player | null>(null)
  const [inspectingOpponent, setInspectingOpponent] = useState<{
    team_name: string
    manager_name: string
    total_points: number
    gameweek_points: number
    picks: any[]
  } | null>(null)

  // Initialize identity from logged-in player session or localStorage
  useEffect(() => {
    let storedId = localStorage.getItem('fpl_manager_id')
    let storedTeam = localStorage.getItem('fpl_team_name')
    let storedManager = localStorage.getItem('fpl_manager_name')

    fetch('/api/player/me')
      .then(r => r.json())
      .then(data => {
        if (data.player) {
          const playerId = data.player.id
          setUserIdentifier(playerId)
          localStorage.setItem('fpl_manager_id', playerId)
          if (storedManager) setManagerName(storedManager)
          else setManagerName(data.player.name)
        } else {
          if (!storedId) {
            storedId = 'mgr_' + Math.random().toString(36).substring(2, 10)
            localStorage.setItem('fpl_manager_id', storedId)
          }
          setUserIdentifier(storedId)
          if (storedManager) setManagerName(storedManager)
        }
      })
      .catch(() => {
        if (!storedId) {
          storedId = 'mgr_' + Math.random().toString(36).substring(2, 10)
          localStorage.setItem('fpl_manager_id', storedId)
        }
        setUserIdentifier(storedId)
        if (storedManager) setManagerName(storedManager)
      })

    if (storedTeam) setTeamName(storedTeam)
  }, [])

  // Fetch initial data
  useEffect(() => {
    if (!userIdentifier) return
    fetchAllData()
  }, [userIdentifier, gameweek])

  const fetchAllData = async () => {
    try {
      // 1. Fetch Stats & Player pool
      const statsRes = await fetch(`/api/fantasy/stats?gameweek=${gameweek}`)
      const statsData = await statsRes.json()
      setAllPlayers(statsData.players || [])
      setGameweeksList(statsData.gameweeks || [])

      // 2. Fetch Leaderboard & FPL Metrics
      const lbRes = await fetch(`/api/fantasy/leaderboard?gameweek=${gameweek}&user_identifier=${userIdentifier}`)
      const lbData = await lbRes.json()
      setLeaderboardData(lbData)

      // 3. Fetch User's Team & Lineup
      const teamRes = await fetch(`/api/fantasy/team?user_identifier=${userIdentifier}&gameweek=${gameweek}`)
      const teamData = await teamRes.json()

      if (teamData.team) {
        setTeamName(teamData.team.team_name)
        setManagerName(teamData.team.manager_name)
        if (teamData.team.formation) setFormation(teamData.team.formation as FormationType)
        localStorage.setItem('fpl_team_name', teamData.team.team_name)
        localStorage.setItem('fpl_manager_name', teamData.team.manager_name)
        setIsSetupModalOpen(false)

        const initialPicks: any = {}
        ;(teamData.picks || []).forEach((p: any) => {
          initialPicks[p.position_slot] = {
            playerId: p.player_id,
            isCaptain: p.is_captain,
            isViceCaptain: p.is_vice_captain
          }
        })
        setSquadPicks(initialPicks)
      } else {
        // If team stored in localStorage, auto-create record so user never sees modal again
        const storedTeam = localStorage.getItem('fpl_team_name') || teamName
        const storedManager = localStorage.getItem('fpl_manager_name') || managerName
        if (storedTeam && storedManager) {
          setTeamName(storedTeam)
          setManagerName(storedManager)
          setIsSetupModalOpen(false)
          fetch('/api/fantasy/team', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_identifier: userIdentifier,
              team_name: storedTeam,
              manager_name: storedManager,
              formation,
              gameweek
            })
          }).catch(() => {})
        } else {
          setIsSetupModalOpen(true)
        }
      }
    } catch (err) {
      console.error('Error fetching fantasy data:', err)
    }
  }

  // Handle Changing Formation
  const handleFormationChange = async (newFormation: FormationType) => {
    setFormation(newFormation)
    if (userIdentifier && teamName && managerName) {
      try {
        await fetch('/api/fantasy/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_identifier: userIdentifier,
            team_name: teamName,
            manager_name: managerName,
            formation: newFormation,
            gameweek
          })
        })
      } catch (err) {
        console.error('Error saving formation:', err)
      }
    }
  }

  // Build current lineup slots dynamically based on active formation
  const filledSlots: PickSlot[] = useMemo(() => {
    const playerMap = new Map(allPlayers.map(p => [p.id, p]))
    const currentSlots = getSlotsForFormation(formation)

    return currentSlots.map(slot => {
      const pick = squadPicks[slot.slotId]
      const player = pick ? playerMap.get(pick.playerId) || null : null
      let pts = 0
      if (player) {
        pts = player.fantasy_points !== undefined ? player.fantasy_points : calculatePlayerPoints(player.position, player.stats || {})
        if (pick?.isCaptain) {
          pts *= 2
        }
      }

      return {
        ...slot,
        player,
        isCaptain: Boolean(pick?.isCaptain),
        isViceCaptain: Boolean(pick?.isViceCaptain),
        computedPoints: pts
      }
    })
  }, [allPlayers, squadPicks, formation])

  const startingSlots = filledSlots.filter(s => s.isStarter)
  const benchSlots = filledSlots.filter(s => !s.isStarter)

  // Calculations
  const startingScore = startingSlots.reduce((acc, s) => acc + s.computedPoints, 0)
  const benchScore = benchSlots.reduce((acc, s) => acc + s.computedPoints, 0)
  const startersCount = startingSlots.filter(s => s.player !== null).length

  // Handle slot click to open transfer drawer
  const handleSlotClick = (slot: FantasySlot | PickSlot) => {
    setActivePickingSlot(slot as FantasySlot)
    setSelectedPosFilter(slot.positionType === 'FLEX' ? 'ALL' : slot.positionType)
    setSearchQuery('')
  }

  // Handle selecting a player into the active slot
  const handleSelectPlayer = (player: Player) => {
    if (!activePickingSlot) return

    setSquadPicks(prev => {
      const next = { ...prev }

      // Remove player if already in another slot
      Object.keys(next).forEach(k => {
        if (next[k].playerId === player.id) {
          delete next[k]
        }
      })

      const hasCaptain = Object.values(next).some(p => p.isCaptain)

      next[activePickingSlot.slotId] = {
        playerId: player.id,
        isCaptain: !hasCaptain && activePickingSlot.isStarter,
        isViceCaptain: false
      }

      return next
    })

    setActivePickingSlot(null)
  }

  // Make Captain
  const handleSetCaptain = (slotId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setSquadPicks(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(k => {
        if (next[k]) {
          next[k] = { ...next[k], isCaptain: k === slotId }
        }
      })
      return next
    })
  }

  // Save Squad Changes
  const handleSaveSquad = async () => {
    if (!teamName.trim() || !managerName.trim()) {
      setIsSetupModalOpen(true)
      return
    }

    setIsSaving(true)
    setSaveSuccess(false)
    try {
      const picksPayload = Object.keys(squadPicks).map(slotId => ({
        position_slot: slotId,
        player_id: squadPicks[slotId].playerId,
        is_captain: squadPicks[slotId].isCaptain,
        is_vice_captain: squadPicks[slotId].isViceCaptain
      }))

      const res = await fetch('/api/fantasy/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_identifier: userIdentifier,
          team_name: teamName,
          manager_name: managerName,
          formation,
          gameweek,
          picks: picksPayload
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save lineup')

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      fetchAllData()
    } catch (err: any) {
      alert(err.message || 'Error saving lineup')
    } finally {
      setIsSaving(false)
    }
  }

  // Inspect Opponent Team from Leaderboard
  const handleInspectOpponent = async (teamId: string) => {
    try {
      const res = await fetch(`/api/fantasy/team?team_id=${teamId}&gameweek=${gameweek}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load opponent')

      const foundInLeaderboard = leaderboardData.leaderboard.find(l => l.team_id === teamId)

      setInspectingOpponent({
        team_name: data.team.team_name,
        manager_name: data.team.manager_name,
        total_points: foundInLeaderboard ? foundInLeaderboard.total_points : 0,
        gameweek_points: data.total_gameweek_points || 0,
        picks: data.picks || []
      })
    } catch (err: any) {
      alert(err.message || 'Error fetching opponent team')
    }
  }

  // Available unique tournament teams for filtering
  const tournamentNations = useMemo(() => {
    const nations = new Set<string>()
    allPlayers.forEach(p => {
      if (p.franchises?.name) nations.add(p.franchises.name)
    })
    return Array.from(nations).sort()
  }, [allPlayers])

  // Filtered players in transfer drawer
  const filteredPlayers = useMemo(() => {
    return allPlayers.filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesTeam = selectedTeamFilter === 'ALL' || player.franchises?.name === selectedTeamFilter
      
      let matchesPos = true
      if (selectedPosFilter !== 'ALL') {
        const pPos = (player.position || '').toUpperCase()
        if (selectedPosFilter === 'GK') matchesPos = pPos.includes('GK') || pPos.includes('GOAL')
        else if (selectedPosFilter === 'DEF') matchesPos = pPos.includes('DEF') || pPos.includes('BACK')
        else if (selectedPosFilter === 'MID') matchesPos = pPos.includes('MID') || pPos.includes('WING')
        else if (selectedPosFilter === 'FWD') matchesPos = pPos.includes('FWD') || pPos.includes('STRIKER') || pPos.includes('ATT')
      }

      return matchesSearch && matchesTeam && matchesPos
    })
  }, [allPlayers, searchQuery, selectedTeamFilter, selectedPosFilter])

  const renderPitchSlot = (slot?: PickSlot) => {
    if (!slot) return null
    const player = slot.player

    return (
      <div
        key={slot.slotId}
        onClick={() => player ? setInspectingPlayer(player) : handleSlotClick(slot)}
        className="flex flex-col items-center group cursor-pointer active:scale-95 transition-transform"
      >
        {/* Player Avatar / Jersey Badge */}
        <div className="relative">
          <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 flex items-center justify-center bg-black/80 shadow-xl transition-all group-hover:ring-2 group-hover:ring-amber-400 ${
            player ? 'border-amber-400' : 'border-dashed border-white/40'
          }`}>
            {player?.photo_url ? (
              <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover object-top" />
            ) : player?.franchises?.logo_url ? (
              <img src={player.franchises.logo_url} alt="" className="w-8 h-8 object-contain" />
            ) : (
              <span className="text-xs font-bold text-[#888]">{slot.positionType}</span>
            )}
          </div>

          {/* Captain Badge */}
          {slot.isCaptain && (
            <span className="absolute -top-1 -right-1 bg-amber-400 text-black text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg border border-black">
              C
            </span>
          )}

          {/* Nation Crest Tag */}
          {player?.franchises?.name && (
            <span className="absolute -bottom-1 -left-1 bg-black text-white text-[8px] font-bold px-1 rounded border border-[#333] truncate max-w-[50px]">
              {player.franchises.name.substring(0, 3).toUpperCase()}
            </span>
          )}
        </div>

        {/* Player Info Card Pill */}
        <div className="mt-1 bg-black/90 border border-white/20 rounded px-2 py-0.5 text-center min-w-[70px] max-w-[90px] shadow-lg">
          <span className="text-[10px] font-bold text-white block truncate">
            {player ? player.name.split(' ')[0] : slot.label}
          </span>
          <span className="text-[9px] font-mono font-bold text-emerald-400 block">
            {player ? `${slot.computedPoints} pts` : slot.positionType}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pb-28 select-none">
      {/* Header Banner */}
      <div className="bg-gradient-to-b from-[#111] via-[#080808] to-black border-b border-[#222] p-4 pt-10">
        <div className="flex items-center justify-between mb-4">
          <Link href="/home" className="text-[#888] hover:text-white transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <span>←</span> Home Feed
          </Link>
          
          {/* Gameweek Selector */}
          <div className="flex items-center gap-2 bg-[#161616] border border-[#333] px-2.5 py-1 rounded-full">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Gameweek</span>
            <select
              value={gameweek}
              onChange={e => setGameweek(parseInt(e.target.value))}
              className="bg-transparent text-white font-bold text-xs uppercase outline-none cursor-pointer"
            >
              {gameweeksList.map(gw => (
                <option key={gw.id} value={gw.id} className="bg-black text-white">
                  GW {gw.id} {gw.status === 'active' ? '(Live)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Title & Manager Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">
              {teamName || 'Your Fantasy Squad'}
            </h1>
            <p className="text-xs text-[#888] font-medium flex items-center gap-2 mt-0.5">
              <span>Manager: <strong className="text-white font-bold">{managerName || 'Anonymous Manager'}</strong></span>
              <button
                onClick={() => setIsSetupModalOpen(true)}
                className="text-[10px] text-amber-400 hover:underline uppercase font-bold"
              >
                [Edit Name]
              </button>
            </p>
          </div>

          {/* Save Lineup Button with Moving Gradient Glow */}
          <button
            onClick={handleSaveSquad}
            disabled={isSaving}
            className={`relative group overflow-hidden px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center ${
              saveSuccess
                ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'text-black shadow-[0_0_15px_rgba(245,158,11,0.4)] hover:shadow-[0_0_22px_rgba(245,158,11,0.7)] active:scale-95'
            }`}
          >
            {!saveSuccess && (
              <>
                <span className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-300 via-amber-500 to-amber-600 bg-[length:200%_200%] animate-gradientMove" />
                <span className="absolute inset-0 bg-amber-400/30 blur-sm group-hover:blur-md transition-all" />
              </>
            )}
            <span className="relative z-10 font-black">
              {isSaving ? 'Saving...' : saveSuccess ? 'Squad Saved!' : 'Save Fantasy Lineup'}
            </span>
          </button>
        </div>

        {/* FPL Top Metric Cards Header */}
        <div className="grid grid-cols-4 gap-2 mt-6">
          {/* Average Score */}
          <div className="bg-[#0e0e0e] border border-[#222] p-2.5 rounded-xl text-center shadow-inner">
            <span className="text-[9px] font-extrabold uppercase text-[#777] tracking-wider block">Average</span>
            <span className="text-lg md:text-xl font-mono font-black text-amber-400 mt-0.5 block">
              {leaderboardData.average_score} <span className="text-[10px] text-[#555] font-normal">pts</span>
            </span>
          </div>

          {/* My Score */}
          <div className="bg-[#0e0e0e] border border-amber-500/40 p-2.5 rounded-xl text-center shadow-inner bg-gradient-to-b from-amber-950/20 to-transparent">
            <span className="text-[9px] font-extrabold uppercase text-amber-400 tracking-wider block">My Score</span>
            <span className="text-lg md:text-xl font-mono font-black text-white mt-0.5 block">
              {startingScore} <span className="text-[10px] text-amber-400 font-normal">pts</span>
            </span>
          </div>

          {/* Highest Score */}
          <div className="bg-[#0e0e0e] border border-[#222] p-2.5 rounded-xl text-center shadow-inner">
            <span className="text-[9px] font-extrabold uppercase text-[#777] tracking-wider block">Highest</span>
            <span className="text-lg md:text-xl font-mono font-black text-emerald-400 mt-0.5 block">
              {leaderboardData.highest_score} <span className="text-[10px] text-[#555] font-normal">pts</span>
            </span>
          </div>

          {/* Overall Rank */}
          <div className="bg-[#0e0e0e] border border-[#222] p-2.5 rounded-xl text-center shadow-inner">
            <span className="text-[9px] font-extrabold uppercase text-[#777] tracking-wider block">Rank</span>
            <span className="text-lg md:text-xl font-mono font-black text-cyan-400 mt-0.5 block">
              {leaderboardData.user_stats?.rank ? `#${leaderboardData.user_stats.rank}` : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-[#222] bg-[#080808] sticky top-0 z-20">
        {[
          { id: 'pitch', label: 'Pitch Lineup' },
          { id: 'transfers', label: 'Pick Team' },
          { id: 'leaderboard', label: 'Leaderboard' },
          { id: 'rules', label: 'Scoring Rules' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2.5 px-1 text-[9px] md:text-[10px] font-bold uppercase tracking-wide transition-all border-b-2 ${
              activeTab === tab.id
                ? 'text-white border-amber-400 bg-black'
                : 'text-[#666] border-transparent hover:text-[#aaa]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="max-w-2xl mx-auto p-4">
        {/* ================= TAB 1: PITCH VIEW ================= */}
        {activeTab === 'pitch' && (
          <div className="space-y-4">
            {/* Formation Selector Bar */}
            <div className="flex items-center justify-between bg-[#0e0e0e] border border-[#222] p-2 rounded-xl">
              <span className="text-[10px] font-extrabold uppercase text-[#777] tracking-wider pl-2">Formation (7-A-Side)</span>
              <div className="flex gap-1.5">
                {(['2-2-2', '3-2-1', '2-3-1'] as const).map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => handleFormationChange(f)}
                    className={`px-3 py-1 text-xs font-black font-mono rounded-lg transition-all cursor-pointer ${
                      formation === f
                        ? 'bg-amber-400 text-black shadow-md'
                        : 'bg-[#18181b] text-[#888] hover:text-white border border-[#262626]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Pitch Container */}
            <div className="relative w-full rounded-2xl overflow-hidden border-2 border-[#1f4e24] shadow-2xl bg-gradient-to-b from-[#0e3a15] via-[#0c3112] to-[#08240d] p-4 pt-6 pb-6">
              {/* Pitch Field Markings */}
              <div className="absolute inset-0 pointer-events-none opacity-20 flex flex-col justify-between p-4">
                <div className="w-32 h-14 border-b-2 border-l-2 border-r-2 border-white mx-auto rounded-b-lg" />
                <div className="w-full border-t-2 border-dashed border-white my-auto flex items-center justify-center">
                  <div className="w-24 h-24 border-2 border-white rounded-full -my-12" />
                </div>
                <div className="w-32 h-14 border-t-2 border-l-2 border-r-2 border-white mx-auto rounded-t-lg" />
              </div>

              {/* Pitch Status Banner */}
              <div className="relative z-10 flex items-center justify-between mb-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px]">
                <span className="font-bold text-amber-300 uppercase tracking-wide">
                  7-A-Side ({formation}) ({startersCount}/7 Selected)
                </span>
                <span className="font-mono text-white font-bold">
                  Live GW: <span className="text-emerald-400">{startingScore} PTS</span>
                </span>
              </div>

              {/* Dynamic 7-A-Side Grid Rows */}
              <div className="relative z-10 flex flex-col gap-6 py-2">
                {/* Row 1: Goalkeeper (1) */}
                <div className="flex justify-center">
                  {renderPitchSlot(filledSlots.find(s => s.slotId === 'GK'))}
                </div>

                {/* Row 2: Defenders */}
                <div className="flex justify-around px-2">
                  {startingSlots.filter(s => s.positionType === 'DEF').map(slot => (
                    <div key={slot.slotId}>{renderPitchSlot(slot)}</div>
                  ))}
                </div>

                {/* Row 3: Midfielders */}
                <div className="flex justify-around px-2">
                  {startingSlots.filter(s => s.positionType === 'MID').map(slot => (
                    <div key={slot.slotId}>{renderPitchSlot(slot)}</div>
                  ))}
                </div>

                {/* Row 4: Forwards */}
                <div className="flex justify-around px-2">
                  {startingSlots.filter(s => s.positionType === 'FWD').map(slot => (
                    <div key={slot.slotId}>{renderPitchSlot(slot)}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bench / Substitutes Box */}
            <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-2">
                <span className="text-xs font-bold text-[#888] uppercase tracking-wider">
                  Substitutes Bench
                </span>
                <span className="text-[10px] text-[#555] font-mono">Bench Points: {benchScore} PTS</span>
              </div>

              <div className="flex justify-around py-1">
                {renderPitchSlot(filledSlots.find(s => s.slotId === 'SUB1'))}
                {renderPitchSlot(filledSlots.find(s => s.slotId === 'SUB2'))}
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setActiveTab('transfers')}
                className="flex-1 bg-[#161616] hover:bg-[#222] border border-[#333] p-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white flex items-center justify-center gap-2 transition-colors"
              >
                Make Transfers
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className="flex-1 bg-[#161616] hover:bg-[#222] border border-[#333] p-3 rounded-xl text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-center gap-2 transition-colors"
              >
                View Leaderboard
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 2: PICK TEAM / TRANSFERS ================= */}
        {activeTab === 'transfers' && (
          <div className="space-y-4">
            <div className="bg-[#0e0e0e] border border-[#222] p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase text-white tracking-wider">Squad Manager (No Budget Limit)</h2>
                <span className="text-[10px] text-emerald-400 font-bold uppercase bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
                  Unlimited Free Picks
                </span>
              </div>
              <p className="text-[11px] text-[#888]">
                Select any registered player from France, Spain, England, Brazil, Argentina, Germany, Mexico, or Portugal. Multiple managers can choose the same player.
              </p>
            </div>

            {/* Slots List for Team Management */}
            <div className="space-y-2">
              {filledSlots.map(slot => (
                <div
                  key={slot.slotId}
                  className="bg-[#0a0a0a] border border-[#222] hover:border-[#444] p-3 rounded-xl flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-12 text-[10px] font-black uppercase text-amber-400 bg-amber-950/30 border border-amber-500/20 px-1.5 py-1 rounded text-center shrink-0">
                      {slot.slotId}
                    </span>

                    {slot.player ? (
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">{slot.player.name}</span>
                          {slot.isCaptain && (
                            <span className="bg-amber-400 text-black text-[9px] font-black px-1 rounded">C (2x)</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#777]">
                          <span>{slot.player.franchises?.name || 'Free Agent'}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-mono font-bold">{slot.computedPoints} pts</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-[#555] italic">-- Empty Slot (Tap to select) --</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {slot.player && slot.isStarter && (
                      <button
                        onClick={() => handleSetCaptain(slot.slotId)}
                        className={`text-[9px] font-extrabold uppercase px-2 py-1 rounded border transition-colors ${
                          slot.isCaptain
                            ? 'bg-amber-400 text-black border-amber-400'
                            : 'bg-black text-[#888] border-[#333] hover:text-white'
                        }`}
                      >
                        {slot.isCaptain ? 'Captain' : 'Make (C)'}
                      </button>
                    )}

                    <button
                      onClick={() => handleSlotClick(slot)}
                      className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg border border-[#333] transition-colors"
                    >
                      {slot.player ? 'Swap' : '+ Add'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSaveSquad}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-black uppercase text-xs tracking-widest p-4 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-xl mt-4"
            >
              {isSaving ? 'Saving Squad...' : 'Save & Lock In Squad'}
            </button>
          </div>
        )}

        {/* ================= TAB 3: LEADERBOARD ================= */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            <div className="bg-[#0e0e0e] border border-[#222] p-4 rounded-xl flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase text-white tracking-wider">Tournament Fantasy Leaderboard</h2>
                <p className="text-[10px] text-[#777] mt-0.5">Click on any manager to inspect their 7-a-side pitch lineup.</p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/40 px-2.5 py-1 rounded border border-amber-500/30">
                {leaderboardData.total_managers} Managers
              </span>
            </div>

            {leaderboardData.leaderboard.length === 0 ? (
              <div className="bg-[#0a0a0a] border border-[#222] p-12 text-center text-[#555] rounded-xl">
                <p className="text-sm uppercase tracking-wider">No fantasy managers registered yet</p>
                <p className="text-xs text-[#777] mt-1">Be the first to create a squad and top the leaderboard.</p>
              </div>
            ) : (
              <div className="bg-[#080808] border border-[#222] rounded-2xl overflow-hidden shadow-xl">
                <div className="grid grid-cols-12 gap-2 bg-[#121212] p-3 text-[10px] font-extrabold uppercase tracking-wider text-[#777] border-b border-[#222]">
                  <span className="col-span-2 text-center">Rank</span>
                  <span className="col-span-6">Team & Manager</span>
                  <span className="col-span-2 text-right">GW Pts</span>
                  <span className="col-span-2 text-right">Total</span>
                </div>

                <div className="divide-y divide-[#181818]">
                  {leaderboardData.leaderboard.map((entry) => {
                    const isMe = entry.user_identifier === userIdentifier
                    return (
                      <div
                        key={entry.team_id}
                        onClick={() => handleInspectOpponent(entry.team_id)}
                        className={`grid grid-cols-12 gap-2 p-3 items-center text-xs transition-colors cursor-pointer hover:bg-[#151515] ${
                          isMe ? 'bg-amber-950/20 border-l-4 border-amber-400' : ''
                        }`}
                      >
                        {/* Rank */}
                        <div className="col-span-2 text-center font-mono font-bold">
                          {entry.rank === 1 ? (
                            <span className="text-amber-400 font-extrabold text-sm">#1</span>
                          ) : entry.rank === 2 ? (
                            <span className="text-slate-300 font-extrabold text-sm">#2</span>
                          ) : entry.rank === 3 ? (
                            <span className="text-amber-600 font-extrabold text-sm">#3</span>
                          ) : (
                            <span className="text-[#888]">#{entry.rank}</span>
                          )}
                        </div>

                        {/* Team & Manager */}
                        <div className="col-span-6 min-w-0">
                          <div className="font-bold text-white truncate flex items-center gap-1.5">
                            <span>{entry.team_name}</span>
                            {isMe && <span className="text-[9px] bg-amber-500 text-black px-1 font-black rounded">YOU</span>}
                          </div>
                          <p className="text-[10px] text-[#666] truncate">{entry.manager_name}</p>
                        </div>

                        {/* GW Points */}
                        <div className="col-span-2 text-right font-mono font-bold text-amber-400">
                          {entry.gameweek_points}
                        </div>

                        {/* Total Points */}
                        <div className="col-span-2 text-right font-mono font-black text-white text-sm">
                          {entry.total_points}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: RULES & SCORING ================= */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="bg-[#0e0e0e] border border-[#222] p-5 rounded-2xl space-y-4">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-amber-400">
                FPL Tournament Scoring Guide
              </h2>

              <div className="space-y-3 text-xs text-[#aaa]">
                <div className="bg-black/60 p-3 rounded-xl border border-[#222] space-y-2">
                  <span className="text-white font-bold uppercase tracking-wider block text-[11px]">Goals</span>
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="bg-[#111] p-2 rounded"><span className="text-[#888] block">Forward</span><strong className="text-white font-mono">+4 PTS</strong></div>
                    <div className="bg-[#111] p-2 rounded"><span className="text-[#888] block">Midfielder</span><strong className="text-white font-mono">+5 PTS</strong></div>
                    <div className="bg-[#111] p-2 rounded"><span className="text-[#888] block">Defender/GK</span><strong className="text-white font-mono">+6 PTS</strong></div>
                  </div>
                </div>

                <div className="bg-black/60 p-3 rounded-xl border border-[#222] space-y-2">
                  <span className="text-white font-bold uppercase tracking-wider block text-[11px]">Assists & Clean Sheets</span>
                  <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
                    <div className="bg-[#111] p-2 rounded"><span className="text-[#888] block">Any Assist</span><strong className="text-emerald-400 font-mono">+3 PTS</strong></div>
                    <div className="bg-[#111] p-2 rounded"><span className="text-[#888] block">Clean Sheet (GK/DEF)</span><strong className="text-emerald-400 font-mono">+4 PTS</strong></div>
                  </div>
                </div>

                <div className="bg-black/60 p-3 rounded-xl border border-[#222] space-y-2">
                  <span className="text-white font-bold uppercase tracking-wider block text-[11px]">Captain Multiplier</span>
                  <p className="text-[11px] text-[#ccc]">
                    Your designated <strong>Captain (C)</strong> scores <span className="text-amber-400 font-bold">2X DOUBLE POINTS</span> in every matchweek.
                  </p>
                </div>

                <div className="bg-black/60 p-3 rounded-xl border border-[#222] space-y-2">
                  <span className="text-white font-bold uppercase tracking-wider block text-[11px]">Appearance & Cards</span>
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div className="bg-[#111] p-2 rounded"><span className="text-[#888] block">Played Match</span><strong className="text-white font-mono">+2 PTS</strong></div>
                    <div className="bg-[#111] p-2 rounded"><span className="text-[#888] block">Yellow Card</span><strong className="text-red-400 font-mono">-1 PT</strong></div>
                    <div className="bg-[#111] p-2 rounded"><span className="text-[#888] block">Red Card</span><strong className="text-red-500 font-mono">-3 PTS</strong></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= PLAYER SELECTION DRAWER / MODAL ================= */}
      {activePickingSlot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-[#0e0e0e] border border-[#222] w-full max-w-lg rounded-t-3xl md:rounded-2xl p-5 space-y-4 max-h-[85vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wide">
                  Pick {activePickingSlot.label} ({activePickingSlot.slotId})
                </h3>
                <p className="text-[11px] text-[#888]">Filter by nation or position to add to your squad</p>
              </div>
              <button
                onClick={() => setActivePickingSlot(null)}
                className="text-[#888] hover:text-white text-sm font-bold uppercase p-1"
              >
                ✕ Close
              </button>
            </div>

            {/* Filters */}
            <div className="space-y-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search players by name..."
                className="w-full bg-black border border-[#333] px-3.5 py-2.5 rounded-xl text-white text-xs outline-none focus:border-amber-400 font-medium"
              />

              {/* Team Pill Filters */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setSelectedTeamFilter('ALL')}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-colors ${
                    selectedTeamFilter === 'ALL' ? 'bg-amber-400 text-black' : 'bg-[#181818] text-[#888]'
                  }`}
                >
                  All Teams
                </button>
                {tournamentNations.map(nation => (
                  <button
                    key={nation}
                    onClick={() => setSelectedTeamFilter(nation)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-colors ${
                      selectedTeamFilter === nation ? 'bg-amber-400 text-black' : 'bg-[#181818] text-[#888]'
                    }`}
                  >
                    {nation}
                  </button>
                ))}
              </div>
            </div>

            {/* Players List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredPlayers.length === 0 ? (
                <div className="text-center py-10 text-[#555] text-xs uppercase">No matching players found</div>
              ) : (
                filteredPlayers.map(player => (
                  <div
                    key={player.id}
                    onClick={() => handleSelectPlayer(player)}
                    className="bg-black border border-[#222] hover:border-amber-400/50 p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all hover:bg-[#141414]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-[#111] border border-[#333] shrink-0">
                        {player.photo_url ? (
                          <img src={player.photo_url} alt="" className="w-full h-full object-cover" />
                        ) : player.franchises?.logo_url ? (
                          <img src={player.franchises.logo_url} alt="" className="w-full h-full object-contain p-1" />
                        ) : (
                          <span className="flex items-center justify-center h-full text-xs font-bold text-[#666]">
                            {player.position || 'PL'}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">{player.name}</span>
                        <div className="flex items-center gap-2 text-[10px] text-[#777]">
                          <span className="text-amber-400 font-bold">{player.franchises?.name || 'Free Agent'}</span>
                          <span>•</span>
                          <span>{player.position || 'Player'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-mono font-black text-emerald-400 block">
                        {player.fantasy_points || 0} pts
                      </span>
                      <span className="text-[9px] font-bold text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                        Select →
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= OPPONENT SQUAD INSPECT MODAL ================= */}
      {inspectingOpponent && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e0e0e] border border-amber-500/30 w-full max-w-lg rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div>
                <span className="text-[9px] font-extrabold text-amber-400 uppercase tracking-widest block">OPPONENT SCOUT</span>
                <h3 className="text-lg font-black text-white uppercase">{inspectingOpponent.team_name}</h3>
                <p className="text-xs text-[#888]">Manager: {inspectingOpponent.manager_name}</p>
              </div>
              <button
                onClick={() => setInspectingOpponent(null)}
                className="text-[#888] hover:text-white font-bold text-sm uppercase p-1"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-black p-2.5 rounded-xl border border-[#222]">
                <span className="text-[#666] text-[10px] font-bold uppercase block">Gameweek {gameweek}</span>
                <span className="text-lg font-mono font-black text-amber-400">{inspectingOpponent.gameweek_points} PTS</span>
              </div>
              <div className="bg-black p-2.5 rounded-xl border border-[#222]">
                <span className="text-[#666] text-[10px] font-bold uppercase block">Total Points</span>
                <span className="text-lg font-mono font-black text-white">{inspectingOpponent.total_points} PTS</span>
              </div>
            </div>

            {/* Lineup List */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-[#888] uppercase tracking-wider block">7-A-Side Squad Lineup:</span>
              {inspectingOpponent.picks.map((pick: any) => (
                <div key={pick.id} className="bg-black border border-[#222] p-2.5 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/30">
                      {pick.position_slot}
                    </span>
                    <span className="font-bold text-white">{pick.players?.name}</span>
                    {pick.is_captain && <span className="bg-amber-400 text-black text-[9px] font-black px-1 rounded">C (2x)</span>}
                  </div>
                  <span className="font-mono font-bold text-emerald-400">{pick.computed_points} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= PLAYER STATS DETAILS MODAL ================= */}
      {inspectingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e0e0e] border border-[#333] w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-black border border-amber-400/50">
                  {inspectingPlayer.photo_url ? (
                    <img src={inspectingPlayer.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="flex items-center justify-center h-full text-xs font-bold text-[#666]">
                      {inspectingPlayer.position || 'PL'}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{inspectingPlayer.name}</h3>
                  <p className="text-[10px] text-amber-400 font-bold uppercase">{inspectingPlayer.franchises?.name || 'Tournament Player'}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectingPlayer(null)}
                className="text-[#888] hover:text-white font-bold text-sm uppercase p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="bg-black p-2 rounded-lg border border-[#222]">
                <span className="text-[#666] text-[10px] uppercase block">Tournament Goals</span>
                <span className="text-base font-mono font-bold text-white">{inspectingPlayer.goals || 0}</span>
              </div>
              <div className="bg-black p-2 rounded-lg border border-[#222]">
                <span className="text-[#666] text-[10px] uppercase block">Tournament Assists</span>
                <span className="text-base font-mono font-bold text-white">{inspectingPlayer.assists || 0}</span>
              </div>
            </div>

            <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 uppercase">GW {gameweek} Fantasy Score</span>
              <span className="text-lg font-mono font-black text-amber-400">{inspectingPlayer.fantasy_points || 0} PTS</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= TEAM SETUP / EDIT NAME MODAL ================= */}
      {isSetupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e0e0e] border border-amber-500/40 w-full max-w-sm rounded-2xl p-6 space-y-5 shadow-2xl">
            <div>
              <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block">FPL REGISTRATION</span>
              <h3 className="text-lg font-black text-white uppercase mt-1">Name Your Fantasy Team</h3>
              <p className="text-xs text-[#888] mt-1">Enter your manager details to compete in the tournament fantasy league.</p>
            </div>

            <form
              onSubmit={async e => {
                e.preventDefault()
                if (teamName.trim() && managerName.trim()) {
                  localStorage.setItem('fpl_team_name', teamName.trim())
                  localStorage.setItem('fpl_manager_name', managerName.trim())
                  setIsSetupModalOpen(false)

                  try {
                    await fetch('/api/fantasy/team', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        user_identifier: userIdentifier,
                        team_name: teamName.trim(),
                        manager_name: managerName.trim(),
                        formation,
                        gameweek
                      })
                    })
                    fetchAllData()
                  } catch (err) {
                    console.error('Error saving team details:', err)
                  }
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider block">Fantasy Team Name</label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  placeholder="e.g. Cave Hill Strikers"
                  className="w-full bg-black border border-[#333] p-3 rounded-xl text-white text-xs outline-none focus:border-amber-400 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider block">Manager Name</label>
                <input
                  type="text"
                  required
                  value={managerName}
                  onChange={e => setManagerName(e.target.value)}
                  placeholder="e.g. Coach Alex"
                  className="w-full bg-black border border-[#333] p-3 rounded-xl text-white text-xs outline-none focus:border-amber-400 font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-black uppercase text-xs tracking-widest p-3.5 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg"
              >
                Confirm & Enter Fantasy League
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer Partner Marquee Ticker */}
      <div className="mt-8">
        <FooterPartnerTicker />
      </div>

      {/* Navigation Bars */}
      <PublicNav />

      <style jsx global>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradientMove {
          animation: gradientMove 3s linear infinite;
        }
      `}</style>
    </div>
  )
}
