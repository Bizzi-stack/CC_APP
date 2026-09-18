'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import PublicNav from '@/components/PublicNav'
import FooterPartnerTicker from '@/components/FooterPartnerTicker'
import { FANTASY_SLOTS, FantasySlot, FormationType, getSlotsForFormation, calculatePlayerPoints, MAX_WEEKLY_TRANSFERS, calculateTransfersUsed } from '@/lib/fantasy'
import Image from 'next/image'

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
  
  // Manager Identity, Team, Formation & FPL Chips
  const [userIdentifier, setUserIdentifier] = useState<string>('')
  const [teamName, setTeamName] = useState<string>('')
  const [managerName, setManagerName] = useState<string>('')
  const [formation, setFormation] = useState<FormationType>('3-3-1')
  const [activeChip, setActiveChip] = useState<'NONE' | 'TRIPLE_CAPTAIN' | 'BENCH_BOOST' | 'FULL_REBUILD'>('NONE')
  const [isFullRebuildActive, setIsFullRebuildActive] = useState<boolean>(false)
  const [rebuildUsed, setRebuildUsed] = useState<boolean>(false)
  const [usedChips, setUsedChips] = useState<string[]>([])
  const [baselinePlayerIds, setBaselinePlayerIds] = useState<string[]>([])
  const [isCarriedOver, setIsCarriedOver] = useState<boolean>(false)
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false)
  
  // Auth state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register')
  const [authUsername, setAuthUsername] = useState('')
  const [authPasscode, setAuthPasscode] = useState('')
  const [authError, setAuthError] = useState('')
  
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Pitch Slot Action Sheet State
  const [actionSlot, setActionSlot] = useState<PickSlot | null>(null)

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
          // Check if logged in as a dedicated Campus Fantasy Manager
          fetch('/api/fantasy/auth')
            .then(r => r.json())
            .then(mgrData => {
              if (mgrData.manager) {
                setUserIdentifier(mgrData.manager.id)
                localStorage.setItem('fpl_manager_id', mgrData.manager.id)
                if (storedManager) setManagerName(storedManager)
                else setManagerName(mgrData.manager.name)
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
        }
      })
      .catch(() => {
        fetch('/api/fantasy/auth')
          .then(r => r.json())
          .then(mgrData => {
            if (mgrData.manager) {
              setUserIdentifier(mgrData.manager.id)
              localStorage.setItem('fpl_manager_id', mgrData.manager.id)
              if (storedManager) setManagerName(storedManager)
              else setManagerName(mgrData.manager.name)
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
        if (teamData.team.active_chip) setActiveChip(teamData.team.active_chip)
        setUsedChips(teamData.team.used_chips || [])
        setRebuildUsed(Boolean(teamData.team.rebuild_used))
        setIsFullRebuildActive(Boolean(teamData.team.is_full_rebuild))
        setBaselinePlayerIds(teamData.baseline_player_ids || [])
        setIsCarriedOver(Boolean(teamData.is_carried_over))
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
              active_chip: activeChip,
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
            active_chip: activeChip,
            gameweek
          })
        })
      } catch (err) {
        console.error('Error saving formation:', err)
      }
    }
  }

  // Handle Toggling FPL Chips (Triple Captain / Bench Boost)
  const handleToggleChip = async (chip: 'TRIPLE_CAPTAIN' | 'BENCH_BOOST') => {
    const nextChip = activeChip === chip ? 'NONE' : chip
    setActiveChip(nextChip)
    if (userIdentifier && teamName && managerName) {
      try {
        await fetch('/api/fantasy/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_identifier: userIdentifier,
            team_name: teamName,
            manager_name: managerName,
            formation,
            active_chip: nextChip,
            gameweek
          })
        })
      } catch (err) {
        console.error('Error toggling chip:', err)
      }
    }
  }

  // Build current lineup slots dynamically based on active formation & active chip
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
          pts *= activeChip === 'TRIPLE_CAPTAIN' ? 3 : 2
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
  }, [allPlayers, squadPicks, formation, activeChip])

  const startingSlots = filledSlots.filter(s => s.isStarter)
  const benchSlots = filledSlots.filter(s => !s.isStarter)

  // Calculations & Transfer Tracking
  const rawStartingScore = startingSlots.reduce((acc, s) => acc + s.computedPoints, 0)
  const benchScore = benchSlots.reduce((acc, s) => acc + s.computedPoints, 0)
  const startingScore = activeChip === 'BENCH_BOOST' ? (rawStartingScore + benchScore) : rawStartingScore
  const startersCount = startingSlots.filter(s => s.player !== null).length

  // Current draft player IDs & weekly transfers used
  const currentDraftPlayerIds = useMemo(() => {
    return Object.values(squadPicks).map(p => p.playerId).filter(Boolean)
  }, [squadPicks])

  const transfersUsed = useMemo(() => {
    if (gameweek <= 1) return 0
    return calculateTransfersUsed(baselinePlayerIds, currentDraftPlayerIds)
  }, [gameweek, baselinePlayerIds, currentDraftPlayerIds])

  const transfersRemaining = Math.max(0, MAX_WEEKLY_TRANSFERS - transfersUsed)

  // Handle slot click to open transfer drawer — default to slot position, or ALL if flex
  const handleSlotClick = (slot: FantasySlot | PickSlot) => {
    setActivePickingSlot(slot as FantasySlot)
    setSelectedPosFilter((slot as FantasySlot).positionType === 'FLEX' ? 'ALL' : (slot as FantasySlot).positionType)
    setSelectedTeamFilter('ALL')
    setSearchQuery('')
  }

  // Handle selecting a player into the active slot with 4-transfer weekly check
  const handleSelectPlayer = (player: Player) => {
    if (!activePickingSlot) return

    // Enforce 4 weekly transfers limit for GW2+ (unless Full Rebuild active)
    if (gameweek > 1 && !isFullRebuildActive && baselinePlayerIds.length > 0) {
      const testDraft: { [slot: string]: string } = {}
      Object.keys(squadPicks).forEach(k => {
        if (squadPicks[k]?.playerId && squadPicks[k].playerId !== player.id) {
          testDraft[k] = squadPicks[k].playerId
        }
      })
      testDraft[activePickingSlot.slotId] = player.id

      const simulatedIds = Object.values(testDraft)
      const simulatedTransfers = calculateTransfersUsed(baselinePlayerIds, simulatedIds)

      if (simulatedTransfers > MAX_WEEKLY_TRANSFERS) {
        if (!rebuildUsed) {
          const activate = window.confirm(
            `Transfer Limit Reached (${MAX_WEEKLY_TRANSFERS}/${MAX_WEEKLY_TRANSFERS} used for Gameweek ${gameweek}).\n\n` +
            `You can only switch out up to ${MAX_WEEKLY_TRANSFERS} players from your previous gameweek squad.\n\n` +
            `Would you like to activate your 1-Time Full Squad Rebuild to unlock unlimited transfers for this gameweek?`
          )
          if (activate) {
            setIsFullRebuildActive(true)
          } else {
            return
          }
        } else {
          alert(`Transfer Limit Reached: You have already used all ${MAX_WEEKLY_TRANSFERS} transfers for Gameweek ${gameweek}. Your 1-Time Full Squad Rebuild has already been used across the tournament.`)
          return
        }
      }
    }

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
          active_chip: isFullRebuildActive ? 'FULL_REBUILD' : activeChip,
          is_full_rebuild: isFullRebuildActive,
          gameweek,
          picks: picksPayload
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save lineup')

      if (data.used_chips) {
        setUsedChips(data.used_chips)
      }
      if (data.rebuild_used !== undefined) {
        setRebuildUsed(Boolean(data.rebuild_used))
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      fetchAllData()
    } catch (err: any) {
      alert(err.message || 'Error saving lineup')
    } finally {
      setIsSaving(false)
    }
  }

  // Trigger 1-Time Full Squad Rebuild
  const handleTriggerFullRebuild = () => {
    if (gameweek <= 1) {
      alert('You already have unlimited squad changes and resets in Gameweek 1 before kickoff!')
      return
    }
    if (rebuildUsed) {
      alert('Your 1-Time Full Squad Rebuild has already been used in an earlier gameweek.')
      return
    }

    const confirmed = window.confirm(
      `Activate 1-Time Full Squad Rebuild for Gameweek ${gameweek}?\n\n` +
      `This unlocks UNLIMITED transfers for Gameweek ${gameweek}, allowing you to overhaul your entire squad.\n\n` +
      `Note: You can only rebuild your squad once across the entire tournament.\n\n` +
      `Activate now?`
    )
    if (confirmed) {
      setIsFullRebuildActive(true)
    }
  }

  // Clear Entire Team & Start Over
  const handleClearTeam = async () => {
    if (gameweek <= 1) {
      if (!window.confirm('Clear your entire squad and start over? (Unlimited resets available before Gameweek 1 kicks off)')) {
        return
      }

      setIsSaving(true)
      setSaveSuccess(false)
      try {
        setSquadPicks({})
        setActiveChip('NONE')
        setIsFullRebuildActive(false)

        if (userIdentifier && teamName && managerName) {
          await fetch('/api/fantasy/team', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_identifier: userIdentifier,
              team_name: teamName,
              manager_name: managerName,
              formation,
              active_chip: 'NONE',
              is_full_rebuild: false,
              gameweek,
              picks: []
            })
          })
        }

        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
        fetchAllData()
      } catch (err: any) {
        alert(err.message || 'Error clearing squad')
      } finally {
        setIsSaving(false)
      }
      return
    }

    // Gameweek 2 onwards
    if (rebuildUsed && !isFullRebuildActive) {
      alert(`You have already used your 1-Time Full Squad Rebuild for this tournament. In regular gameweeks, you can switch out up to ${MAX_WEEKLY_TRANSFERS} players from your carried-over squad.`)
      return
    }

    if (!isFullRebuildActive) {
      const confirmed = window.confirm(
        `Activate 1-Time Full Squad Rebuild for Gameweek ${gameweek}?\n\n` +
        `You can only clear out your side and rebuild it ONCE across the entire tournament after Gameweek 1.\n\n` +
        `This will clear your squad and allow unlimited transfers for Gameweek ${gameweek}.\n\n` +
        `Are you sure you want to activate your 1-Time Rebuild now?`
      )
      if (!confirmed) return
      setIsFullRebuildActive(true)
      setSquadPicks({})
      setActiveChip('FULL_REBUILD')
    } else {
      if (!window.confirm('Clear all player picks from your pitch?')) return
      setSquadPicks({})
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
        if (selectedPosFilter === 'GK') {
          matchesPos = ['GK', 'GOAL'].some(term => pPos.includes(term))
        } else if (selectedPosFilter === 'DEF') {
          matchesPos = ['DEF', 'BACK', 'CB', 'LB', 'RB', 'LWB', 'RWB'].some(term => pPos.includes(term) || pPos === term)
        } else if (selectedPosFilter === 'MID') {
          matchesPos = ['MID', 'WING', 'CM', 'CDM', 'CAM', 'LM', 'RM'].some(term => pPos.includes(term) || pPos === term)
        } else if (selectedPosFilter === 'FWD') {
          matchesPos = ['FWD', 'STRIKER', 'ATT', 'ST', 'CF', 'LW', 'RW'].some(term => pPos.includes(term) || pPos === term)
        }
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
        onClick={() => slot.player ? setActionSlot(slot) : handleSlotClick(slot)}
        className="flex flex-col items-center group cursor-pointer active:scale-95 transition-transform"
      >
        {/* Player Avatar / Jersey Badge */}
        <div className="relative">
          <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 flex items-center justify-center bg-black/80 shadow-xl transition-all group-hover:ring-2 group-hover:ring-amber-400 ${
            player ? 'border-amber-400' : 'border-dashed border-white/40'
          }`}>
            {player?.photo_url ? (
              <Image width={500} height={500} src={player.photo_url} alt={player.name} className="w-full h-full object-cover object-top" />
            ) : player?.franchises?.logo_url ? (
              <Image width={500} height={500} src={player.franchises.logo_url} alt="" className="w-8 h-8 object-contain" />
            ) : (
              <span className="text-xs font-bold text-[#888]">{slot.positionType}</span>
            )}
          </div>

          {/* Captain Badge */}
          {slot.isCaptain && (
            <span className={`absolute -top-1 -right-1 font-black rounded-full flex items-center justify-center shadow-lg border border-black transition-all ${
              activeChip === 'TRIPLE_CAPTAIN'
                ? 'bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 text-black text-[9px] px-1.5 py-0.5 ring-2 ring-amber-300'
                : 'bg-amber-400 text-black text-[10px] w-5 h-5'
            }`}>
              {activeChip === 'TRIPLE_CAPTAIN' ? '3X' : 'C'}
            </span>
          )}

          {/* Transferred In Badge */}
          {gameweek > 1 && baselinePlayerIds.length > 0 && player && !baselinePlayerIds.includes(player.id) && (
            <span className="absolute -top-1 -left-1 bg-emerald-400 text-black text-[8px] font-black px-1.5 py-0.2 rounded-full border border-black shadow z-10">
              ⇄ IN
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
                [Login / Switch Account]
              </button>
            </p>

            {/* Gameweek Transfer & Rebuild Status Badge */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {gameweek <= 1 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-950/50 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Pre-GW1 • Unlimited Squad Changes & Resets
                </span>
              ) : isFullRebuildActive ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-950/60 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                  <span>⚡</span>
                  1-Time Full Rebuild Active • Unlimited Transfers
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#141414] text-[#ccc] border border-[#2c2c2c]">
                  <span className="text-[#777]">Transfers:</span>
                  <span className={`font-mono font-bold ${transfersUsed > 0 ? 'text-amber-400' : 'text-white'}`}>
                    {transfersUsed} / {MAX_WEEKLY_TRANSFERS} Used
                  </span>
                  <span className="text-[#555]">·</span>
                  <span className={`font-mono font-bold ${transfersRemaining > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {transfersRemaining} Left
                  </span>
                </span>
              )}

              {gameweek > 1 && (
                rebuildUsed ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase text-[#666] bg-[#111] border border-[#222]">
                    🔒 1-Time Rebuild Used
                  </span>
                ) : isFullRebuildActive ? (
                  <button
                    type="button"
                    onClick={() => setIsFullRebuildActive(false)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase text-amber-400 hover:text-white bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 transition-colors cursor-pointer"
                  >
                    ✕ Cancel Rebuild
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleTriggerFullRebuild}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase text-amber-400 hover:text-black bg-amber-500/10 hover:bg-amber-400 border border-amber-500/40 transition-colors cursor-pointer"
                  >
                    ⚡ 1-Time Rebuild Available
                  </button>
                )
              )}
            </div>
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
            {/* Formation & FPL Chips Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-[#0e0e0e] border border-[#222] p-2 rounded-xl">
                <span className="text-[10px] font-extrabold uppercase text-[#777] tracking-wider pl-2">Formation (8-A-Side)</span>
                <div className="flex gap-1.5 flex-wrap">
                  {(['3-3-1', '3-2-2', '4-2-1', '2-3-2'] as const).map(f => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => handleFormationChange(f)}
                      className={`px-2.5 py-1 text-xs font-black font-mono rounded-lg transition-all cursor-pointer ${
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

              {/* FPL Chips Selector Box */}
              <div className="bg-[#0c0c0c] border border-amber-500/30 p-3 rounded-2xl space-y-2 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">
                    FPL CHIPS (GAMEWEEK {gameweek})
                  </span>
                  <span className="text-[9px] text-[#777] font-mono uppercase font-bold">1 Chip per GW</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Triple Captain Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleChip('TRIPLE_CAPTAIN')}
                    className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                      activeChip === 'TRIPLE_CAPTAIN'
                        ? 'bg-gradient-to-r from-amber-950/70 via-amber-900/50 to-amber-950/70 border-amber-400 text-white ring-2 ring-amber-400/50 shadow-xl'
                        : 'bg-black border-[#262626] text-[#888] hover:text-white hover:border-[#444]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-white">Triple Captain</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded font-mono ${
                        activeChip === 'TRIPLE_CAPTAIN' ? 'bg-amber-400 text-black' : 'bg-[#1e1e1e] text-[#666]'
                      }`}>
                        3X
                      </span>
                    </div>
                    <p className="text-[10px] text-[#aaa] mt-1 font-medium leading-tight">Captain earns 3x points instead of 2x</p>
                  </button>

                  {/* Bench Boost Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleChip('BENCH_BOOST')}
                    className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                      activeChip === 'BENCH_BOOST'
                        ? 'bg-gradient-to-r from-emerald-950/70 via-emerald-900/50 to-emerald-950/70 border-emerald-400 text-white ring-2 ring-emerald-400/50 shadow-xl'
                        : 'bg-black border-[#262626] text-[#888] hover:text-white hover:border-[#444]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-white">Bench Boost</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded font-mono ${
                        activeChip === 'BENCH_BOOST' ? 'bg-emerald-400 text-black' : 'bg-[#1e1e1e] text-[#666]'
                      }`}>
                        ALL
                      </span>
                    </div>
                    <p className="text-[10px] text-[#aaa] mt-1 font-medium leading-tight">Points from bench subs count in total score</p>
                  </button>
                </div>
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
                  8-A-Side ({formation}) ({startersCount}/8 Selected)
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
            <div className={`rounded-2xl p-4 shadow-lg space-y-3 transition-all ${
              activeChip === 'BENCH_BOOST'
                ? 'bg-gradient-to-b from-emerald-950/40 to-[#0a0a0a] border-2 border-emerald-500/60 shadow-emerald-950/50'
                : 'bg-[#0a0a0a] border border-[#222]'
            }`}>
              <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${activeChip === 'BENCH_BOOST' ? 'text-emerald-400 font-black' : 'text-[#888]'}`}>
                    Substitutes Bench
                  </span>
                  {activeChip === 'BENCH_BOOST' && (
                    <span className="bg-emerald-400 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wider flex items-center gap-1">
                      BENCH BOOST ACTIVE (SCORING PTS)
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#555] font-mono font-bold">Bench Points: {benchScore} PTS</span>
              </div>

              <div className="flex justify-around py-1">
                {renderPitchSlot(filledSlots.find(s => s.slotId === 'SUB1'))}
                {renderPitchSlot(filledSlots.find(s => s.slotId === 'SUB2'))}
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => setActiveTab('transfers')}
                className="bg-[#161616] hover:bg-[#222] border border-[#333] p-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                Make Transfers
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className="bg-[#161616] hover:bg-[#222] border border-[#333] p-3 rounded-xl text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                Leaderboard
              </button>
              <button
                onClick={handleClearTeam}
                disabled={isSaving || (gameweek > 1 && rebuildUsed && !isFullRebuildActive)}
                className={`border p-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  gameweek > 1 && rebuildUsed && !isFullRebuildActive
                    ? 'bg-[#141414] border-[#222] text-[#555] cursor-not-allowed'
                    : gameweek > 1 && !isFullRebuildActive
                    ? 'bg-amber-950/40 hover:bg-amber-900/50 border-amber-500/40 text-amber-400'
                    : 'bg-red-950/40 hover:bg-red-900/50 border-red-500/40 text-red-400'
                }`}
                title={gameweek > 1 && rebuildUsed && !isFullRebuildActive ? '1-Time Rebuild already used' : undefined}
              >
                {gameweek <= 1 ? 'Clear Team' : isFullRebuildActive ? 'Clear Team' : '⚡ Rebuild'}
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 2: PICK TEAM / TRANSFERS ================= */}
        {activeTab === 'transfers' && (
          <div className="space-y-4">
            {/* Squad Manager & Transfer Policy Header Card */}
            <div className="bg-[#0e0e0e] border border-[#222] p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-sm font-bold uppercase text-white tracking-wider">
                  {gameweek <= 1
                    ? 'Squad Manager (Pre-GW1 Setup)'
                    : isFullRebuildActive
                    ? 'Squad Manager (⚡ 1-Time Rebuild Active)'
                    : `Squad Manager (Gameweek ${gameweek})`}
                </h2>
                {gameweek <= 1 ? (
                  <span className="text-[10px] text-emerald-400 font-bold uppercase bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
                    Unlimited Free Picks
                  </span>
                ) : isFullRebuildActive ? (
                  <span className="text-[10px] text-amber-300 font-bold uppercase bg-amber-950/50 border border-amber-500/40 px-2 py-0.5 rounded animate-pulse">
                    ⚡ Unlimited Rebuild Transfers
                  </span>
                ) : (
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                    transfersRemaining > 0
                      ? 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
                      : 'text-amber-400 bg-amber-950/40 border-amber-500/30'
                  }`}>
                    {transfersRemaining} Transfers Remaining ({transfersUsed}/{MAX_WEEKLY_TRANSFERS})
                  </span>
                )}
              </div>

              {gameweek > 1 && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="bg-[#141414] border border-[#222] p-2 rounded-lg text-center">
                    <span className="text-[9px] uppercase font-bold text-[#777] block">Transfers Used</span>
                    <span className="text-sm font-black font-mono text-amber-400">
                      {isFullRebuildActive ? 'Unlimited' : `${transfersUsed} / ${MAX_WEEKLY_TRANSFERS}`}
                    </span>
                  </div>
                  <div className="bg-[#141414] border border-[#222] p-2 rounded-lg text-center">
                    <span className="text-[9px] uppercase font-bold text-[#777] block">Transfers Left</span>
                    <span className={`text-sm font-black font-mono ${transfersRemaining > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isFullRebuildActive ? '∞' : `${transfersRemaining}`}
                    </span>
                  </div>
                  <div className="bg-[#141414] border border-[#222] p-2 rounded-lg text-center flex flex-col justify-center items-center">
                    <span className="text-[9px] uppercase font-bold text-[#777] block">1-Time Rebuild</span>
                    {rebuildUsed ? (
                      <span className="text-[10px] font-bold text-[#666] uppercase">🔒 Used</span>
                    ) : isFullRebuildActive ? (
                      <span className="text-[10px] font-bold text-amber-400 uppercase">⚡ Active</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleTriggerFullRebuild}
                        className="text-[9px] font-extrabold uppercase text-amber-400 hover:text-white bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 px-2 py-0.5 rounded transition-colors cursor-pointer"
                      >
                        ⚡ Activate
                      </button>
                    )}
                  </div>
                </div>
              )}

              <p className="text-[11px] text-[#888]">
                {gameweek <= 1
                  ? 'Before Gameweek 1 kicks off, you can make unlimited squad changes and full team clears. Multiple managers can choose the same player.'
                  : isFullRebuildActive
                  ? '1-Time Full Squad Rebuild is active! You can freely clear out and overhaul all 10 players for this gameweek without counting against your weekly transfer limit.'
                  : `You get up to ${MAX_WEEKLY_TRANSFERS} player transfers from your carried-over squad every gameweek. (To overhaul your full team, use your 1-time tournament rebuild).`}
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white truncate">{slot.player.name}</span>
                          {slot.isCaptain && (
                            <span className="bg-amber-400 text-black text-[9px] font-black px-1 rounded">C</span>
                          )}
                          {gameweek > 1 && baselinePlayerIds.length > 0 && !baselinePlayerIds.includes(slot.player.id) && (
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[8px] font-black px-1.5 py-0.5 rounded">
                              ⇄ IN
                            </span>
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
                        className={`text-[9px] font-extrabold uppercase px-2 py-1 rounded border transition-colors cursor-pointer ${
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
                      className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg border border-[#333] transition-colors cursor-pointer"
                    >
                      {slot.player ? 'Swap' : '+ Add'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleSaveSquad}
                disabled={isSaving}
                className="flex-1 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-black uppercase text-xs tracking-widest p-4 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-xl cursor-pointer"
              >
                {isSaving ? 'Saving Squad...' : 'Save & Lock In Squad'}
              </button>

              <button
                onClick={handleClearTeam}
                disabled={isSaving || (gameweek > 1 && rebuildUsed && !isFullRebuildActive)}
                className={`border text-xs font-bold uppercase tracking-wider px-4 py-4 rounded-xl transition-all cursor-pointer ${
                  gameweek > 1 && rebuildUsed && !isFullRebuildActive
                    ? 'bg-[#141414] border-[#222] text-[#555] cursor-not-allowed'
                    : gameweek > 1 && !isFullRebuildActive
                    ? 'bg-amber-950/40 hover:bg-amber-900/60 border-amber-500/50 text-amber-400'
                    : 'bg-red-950/40 hover:bg-red-900/60 border-red-500/50 text-red-400'
                }`}
                title={gameweek > 1 && rebuildUsed && !isFullRebuildActive ? '1-Time Rebuild already used' : undefined}
              >
                {gameweek <= 1
                  ? 'Clear Team'
                  : isFullRebuildActive
                  ? 'Clear Team'
                  : '⚡ Rebuild Squad'}
              </button>
            </div>
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

            {/* Most Common Players Widget */}
            {leaderboardData.most_common_players && leaderboardData.most_common_players.length > 0 && (
              <div className="bg-gradient-to-r from-[#111] to-[#0a0a0a] border border-[#222] p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">TRENDING</span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Most Picked Players</span>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                  {leaderboardData.most_common_players.map((p: any, idx: number) => (
                    <div key={p.name} className="flex items-center gap-2 shrink-0 bg-black/50 px-2.5 py-1.5 rounded-lg border border-[#222]">
                      <span className="text-[10px] font-black text-[#555]">#{idx + 1}</span>
                      {p.photo_url ? (
                        <img src={p.photo_url} alt={p.name} className="w-5 h-5 rounded-full object-cover border border-[#333]" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-[#222] border border-[#333]" />
                      )}
                      <div>
                        <p className="text-[10px] font-bold text-white whitespace-nowrap">{p.name}</p>
                        <p className="text-[9px] text-[#777] font-mono leading-none mt-0.5">{p.ownership_percentage}% Owned</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
            {/* Squad Management & Transfers Rules Card */}
            <div className="bg-gradient-to-r from-amber-950/40 via-black to-amber-950/40 border border-amber-500/40 p-5 rounded-2xl space-y-3 shadow-xl">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-base">⚡</span>
                <h2 className="text-sm font-black uppercase tracking-wider text-white">
                  Tournament Transfer & Rebuild Rules
                </h2>
              </div>
              
              <div className="space-y-2.5 text-xs text-[#bbb]">
                <div className="bg-black/60 p-3 rounded-xl border border-[#222]">
                  <strong className="text-emerald-400 block uppercase font-mono text-[11px] mb-1">
                    1. Pre-GW1 Kickoff (Initial Squad Setup)
                  </strong>
                  <p>
                    Before the first game week kicks off, you have <strong>unlimited free transfers</strong> and can completely clear out and rebuild your squad as many times as you want without restrictions.
                  </p>
                </div>

                <div className="bg-black/60 p-3 rounded-xl border border-[#222]">
                  <strong className="text-amber-400 block uppercase font-mono text-[11px] mb-1">
                    2. Every Gameweek: 4 Free Transfers
                  </strong>
                  <p>
                    Starting from Gameweek 2 onwards, your squad carries forward into each new matchweek. Every game week, you get the opportunity to <strong>switch out up to 4 players</strong> from your team without penalty.
                  </p>
                </div>

                <div className="bg-black/60 p-3 rounded-xl border border-[#222]">
                  <strong className="text-cyan-400 block uppercase font-mono text-[11px] mb-1">
                    3. 1-Time Full Squad Rebuild ("Wildcard")
                  </strong>
                  <p>
                    After the first game week, you are allowed to <strong>fully clear out and rebuild your squad ONCE</strong> across the entire tournament. Activating this unlocks unlimited transfers for that gameweek. Once used, it is permanently locked for the rest of the tournament.
                  </p>
                </div>
              </div>
            </div>

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
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-end md:items-center justify-center p-2 pb-20 md:p-4" onClick={() => setActivePickingSlot(null)}>
          <div className="bg-[#0e0e0e] border border-[#222] w-full max-w-lg rounded-2xl p-4 md:p-5 space-y-3 max-h-[78vh] md:max-h-[85vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wide">
                  Pick {activePickingSlot.label} ({activePickingSlot.slotId})
                </h3>
                {gameweek <= 1 ? (
                  <p className="text-[11px] text-emerald-400 font-medium">Pre-GW1: Unlimited free picks & squad changes</p>
                ) : isFullRebuildActive ? (
                  <p className="text-[11px] text-amber-400 font-medium">⚡ 1-Time Full Rebuild Active: Unlimited transfers</p>
                ) : (
                  <p className="text-[11px] text-[#aaa] font-medium">
                    GW {gameweek} Transfers: <strong className={transfersRemaining > 0 ? 'text-emerald-400' : 'text-amber-400'}>
                      {transfersUsed}/{MAX_WEEKLY_TRANSFERS} used ({transfersRemaining} remaining)
                    </strong>
                  </p>
                )}
              </div>
              <button
                onClick={() => setActivePickingSlot(null)}
                className="text-[#888] hover:text-white text-xs font-bold uppercase p-1.5 bg-[#181818] rounded-lg border border-[#333]"
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

              {/* Position Filter Pills (Default ALL) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-[#181818]">
                <span className="text-[9px] font-bold text-[#666] uppercase pr-1">Pos:</span>
                {[
                  { id: 'ALL', label: 'All Players' },
                  { id: 'GK', label: 'Goalkeepers' },
                  { id: 'DEF', label: 'Defenders' },
                  { id: 'MID', label: 'Midfielders' },
                  { id: 'FWD', label: 'Forwards' }
                ].map(pos => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => setSelectedPosFilter(pos.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-colors ${
                      selectedPosFilter === pos.id ? 'bg-amber-400 text-black' : 'bg-[#181818] text-[#888]'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>

              {/* Team Pill Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[9px] font-bold text-[#666] uppercase pr-1">Team:</span>
                <button
                  type="button"
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
                    type="button"
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
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-16">
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
                          <Image width={500} height={500} src={player.photo_url} alt="" className="w-full h-full object-cover" />
                        ) : player.franchises?.logo_url ? (
                          <Image width={500} height={500} src={player.franchises.logo_url} alt="" className="w-full h-full object-contain p-1" />
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

      {/* ================= PITCH SLOT ACTION MODAL ================= */}
      {actionSlot && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e0e0e] border border-amber-500/40 w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-black border-2 border-amber-400 shrink-0">
                  {actionSlot.player?.photo_url ? (
                    <Image width={500} height={500} src={actionSlot.player.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : actionSlot.player?.franchises?.logo_url ? (
                    <Image width={500} height={500} src={actionSlot.player.franchises.logo_url} alt="" className="w-full h-full object-contain p-1" />
                  ) : (
                    <span className="flex items-center justify-center h-full text-xs font-bold text-[#666]">
                      {actionSlot.positionType}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{actionSlot.player?.name || actionSlot.label}</h3>
                  <p className="text-[10px] text-amber-400 font-bold uppercase truncate">
                    Slot: {actionSlot.label} ({actionSlot.player?.position || actionSlot.positionType})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActionSlot(null)}
                className="text-[#888] hover:text-white font-bold text-sm uppercase p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 pt-1">
              {/* Option 1: Swap / Replace Player from Database */}
              <button
                type="button"
                onClick={() => {
                  const targetSlot = actionSlot
                  setActionSlot(null)
                  handleSlotClick(targetSlot)
                }}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase p-3 rounded-xl flex items-center justify-between shadow-lg cursor-pointer transition-all active:scale-[0.98]"
              >
                <span className="flex items-center gap-2">
                  <span>🔄</span> Replace with Player from Database
                </span>
                <span className="font-mono text-[10px]">Select →</span>
              </button>

              {/* Option 2: Set as Captain */}
              {actionSlot.isStarter && (
                <button
                  type="button"
                  onClick={() => {
                    handleSetCaptain(actionSlot.slotId)
                    setActionSlot(null)
                  }}
                  className={`w-full text-xs font-bold uppercase p-3 rounded-xl flex items-center justify-between border cursor-pointer transition-all ${
                    actionSlot.isCaptain
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                      : 'bg-black border-[#222] text-white hover:border-amber-400/50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>👑</span> {actionSlot.isCaptain ? 'Currently Captain' : 'Make Captain (2x / 3x Pts)'}
                  </span>
                  {actionSlot.isCaptain && <span className="text-[10px] bg-amber-400 text-black font-black px-1.5 py-0.5 rounded">ACTIVE</span>}
                </button>
              )}

              {/* Option 3: Inspect Player Stats */}
              {actionSlot.player && (
                <button
                  type="button"
                  onClick={() => {
                    setInspectingPlayer(actionSlot.player)
                    setActionSlot(null)
                  }}
                  className="w-full bg-black border border-[#222] hover:border-[#444] text-[#aaa] hover:text-white font-bold text-xs uppercase p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all"
                >
                  <span className="flex items-center gap-2">
                    <span>📊</span> View Player Profile & Stats
                  </span>
                  <span className="font-mono text-[10px] text-emerald-400">{actionSlot.computedPoints} pts</span>
                </button>
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
                className="text-[#888] hover:text-white font-bold text-sm uppercase p-1 cursor-pointer"
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
              <span className="text-[10px] font-bold text-[#888] uppercase tracking-wider block">8-A-Side Squad Lineup:</span>
              {inspectingOpponent.picks.map((pick: any) => (
                <div key={pick.id} className="bg-black border border-[#222] p-2.5 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/30">
                      {pick.position_slot}
                    </span>
                    <span className="font-bold text-white">{pick.players?.name}</span>
                    {pick.is_captain && <span className="bg-amber-400 text-black text-[9px] font-black px-1 rounded">C</span>}
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
                    <Image width={500} height={500} src={inspectingPlayer.photo_url} alt="" className="w-full h-full object-cover" />
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

      {/* ================= TEAM SETUP / AUTH MODAL ================= */}
      {isSetupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e0e0e] border border-amber-500/40 w-full max-w-sm rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block">FPL MANAGER</span>
                <h3 className="text-lg font-black text-white uppercase mt-1">{authMode === 'register' ? 'Register' : 'Log In'}</h3>
              </div>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${authMode === 'login' ? 'bg-amber-500 text-black' : 'bg-[#222] text-[#888]'}`}
                >Login</button>
                <button 
                  type="button"
                  onClick={() => { setAuthMode('register'); setAuthError(''); }}
                  className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${authMode === 'register' ? 'bg-amber-500 text-black' : 'bg-[#222] text-[#888]'}`}
                >Sign Up</button>
              </div>
            </div>

            {authError && (
              <div className="bg-red-950/50 border border-red-500/50 p-3 rounded-lg text-red-500 text-xs font-bold text-center">
                {authError}
              </div>
            )}

            <form
              onSubmit={async e => {
                e.preventDefault()
                setAuthError('')
                
                try {
                  const res = await fetch('/api/fantasy/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: authMode,
                      name: authMode === 'register' ? managerName.trim() : undefined,
                      username: authUsername.trim(),
                      passcode: authPasscode.trim()
                    })
                  })
                  const data = await res.json()
                  
                  if (!res.ok) {
                    setAuthError(data.error || 'Authentication failed')
                    return
                  }
                  
                  // Login/Register Success
                  setUserIdentifier(data.manager.id)
                  localStorage.setItem('fpl_manager_id', data.manager.id)
                  localStorage.setItem('fpl_manager_name', data.manager.username)
                  setManagerName(data.manager.name)
                  
                  if (authMode === 'register') {
                    // Create Team record right away
                    await fetch('/api/fantasy/team', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        user_identifier: data.manager.id,
                        team_name: teamName.trim() || `${data.manager.username} FC`,
                        manager_name: data.manager.name,
                        formation,
                        gameweek
                      })
                    })
                  }
                  
                  setIsSetupModalOpen(false)
                  fetchAllData()
                } catch (err) {
                  setAuthError('Network error. Please try again.')
                }
              }}
              className="space-y-4"
            >
              {authMode === 'register' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider block">Your Full Name</label>
                    <input
                      type="text"
                      required
                      value={managerName}
                      onChange={e => setManagerName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full bg-black border border-[#333] p-3 rounded-xl text-white text-xs outline-none focus:border-amber-400 font-bold"
                    />
                  </div>
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
                </>
              )}
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider block">Username</label>
                <input
                  type="text"
                  required
                  value={authUsername}
                  onChange={e => setAuthUsername(e.target.value.replace(/\s+/g, '').toLowerCase())}
                  placeholder="e.g. jdoe23"
                  className="w-full bg-black border border-[#333] p-3 rounded-xl text-white text-xs outline-none focus:border-amber-400 font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#888] uppercase tracking-wider block">4-Digit PIN Passcode</label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={authPasscode}
                  onChange={e => setAuthPasscode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 1234"
                  className="w-full bg-black border border-[#333] p-3 rounded-xl text-white text-xs outline-none focus:border-amber-400 font-bold tracking-widest text-center"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-black uppercase text-xs tracking-widest p-3.5 rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-lg"
              >
                {authMode === 'register' ? 'Register & Enter Fantasy League' : 'Log In'}
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
