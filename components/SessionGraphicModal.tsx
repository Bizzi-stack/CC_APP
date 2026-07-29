'use client'

import React, { useState, useEffect } from 'react'

export interface SessionSignup {
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

export interface SessionGraphicModalProps {
  session: {
    id: string
    title: string
    date: string
    time: string
    location: string
    notes?: string
    image_url?: string
    has_team_selection?: boolean
    team_a_name?: string
    team_b_name?: string
    signups?: SessionSignup[]
  }
  onClose: () => void
  onSignupSuccess?: () => void
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatTime(timeStr: string) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${m} ${ampm}`
}

export default function SessionGraphicModal({ session, onClose, onSignupSuccess }: SessionGraphicModalProps) {
  const [signups, setSignups] = useState<SessionSignup[]>(session.signups || [])
  const [userPlayer, setUserPlayer] = useState<any | null>(null)
  const [signingUp, setSigningUp] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // Fetch logged in player & fresh signups
  useEffect(() => {
    fetch('/api/player/me')
      .then(r => r.json())
      .then(data => {
        if (data.player) setUserPlayer(data.player)
      })
      .catch(() => {})

    fetch(`/api/sessions/signup?session_id=${session.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.signups) setSignups(data.signups)
      })
      .catch(() => {})
  }, [session.id])

  const teamAName = session.team_a_name || 'Red Team'
  const teamBName = session.team_b_name || 'Blue Team'

  const teamASignups = signups.filter(s => s.selected_team === teamAName)
  const teamBSignups = signups.filter(s => s.selected_team === teamBName)

  const userCurrentSignup = userPlayer ? signups.find(s => s.player_id === userPlayer.id) : null

  const handleJoinTeam = async (teamName: string) => {
    setSigningUp(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      const res = await fetch('/api/sessions/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          player_id: userPlayer?.id,
          selected_team: teamName
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to join team')

      // Refresh local signups list
      const updatedRes = await fetch(`/api/sessions/signup?session_id=${session.id}`)
      const updatedData = await updatedRes.json()
      if (updatedData.signups) setSignups(updatedData.signups)

      setSuccessMsg(`You joined ${teamName}! See you on Friday! ⚽`)
      if (onSignupSuccess) onSignupSuccess()
    } catch (err: any) {
      setErrorMsg(err.message || 'Signup error. Please log in first.')
    } finally {
      setSigningUp(false)
    }
  }

  const posterImage = session.image_url || '/schedule_graphic.png'

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-black border border-white p-6 rounded-none shadow-2xl space-y-4 text-left max-h-[92vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#333] pb-3 shrink-0">
          <div>
            <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>⚽</span> {session.title || 'Friday Ball'}
            </h3>
            <p className="text-[10px] text-[#888] font-mono mt-0.5">
              {formatDate(session.date)} · {formatTime(session.time)} @ {session.location}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-none bg-[#1c1c1c] text-[#aaa] hover:text-white flex items-center justify-center text-xs font-bold shrink-0 border border-[#444]"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 pr-1 flex-1 custom-scrollbar">
          {/* Full Graphic Poster */}
          <div className="relative w-full rounded-none overflow-hidden border border-[#333] shadow-2xl bg-black flex justify-center">
            <img src={posterImage} alt={session.title} className="w-full max-h-80 object-contain" />
          </div>

          {/* User Status / Notification */}
          {userCurrentSignup && (
            <div className="bg-[#111] border border-emerald-500 p-3 rounded-none text-center text-xs text-emerald-400 font-bold uppercase tracking-wider">
              ✓ SIGNED UP FOR <span className="underline">{userCurrentSignup.selected_team}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-[#111] border border-emerald-500 text-emerald-300 text-xs p-3 rounded-none text-center font-bold">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="bg-[#111] border border-red-500 text-red-400 text-xs p-3 rounded-none text-center font-mono">
              {errorMsg}
            </div>
          )}

          {/* Interactive Team Selection Section */}
          <div className="bg-black border border-white p-4 rounded-none space-y-3 text-center shadow-lg">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-center gap-1.5 font-mono">
              SELECT YOUR TEAM FOR FRIDAY
            </h4>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                disabled={signingUp}
                onClick={() => handleJoinTeam(teamAName)}
                className={`h-12 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-none transition-all active:scale-95 flex items-center justify-center gap-2 border border-white ${
                  userCurrentSignup?.selected_team === teamAName ? 'ring-2 ring-white' : ''
                }`}
              >
                <img src="/red_team.png" alt="Red Team" className="w-6 h-6 object-contain shrink-0" />
                <span>JOIN {teamAName}</span>
              </button>

              <button
                type="button"
                disabled={signingUp}
                onClick={() => handleJoinTeam(teamBName)}
                className={`h-12 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-none transition-all active:scale-95 flex items-center justify-center gap-2 border border-white ${
                  userCurrentSignup?.selected_team === teamBName ? 'ring-2 ring-white' : ''
                }`}
              >
                <img src="/blue_team.png" alt="Blue Team" className="w-6 h-6 object-contain shrink-0" />
                <span>JOIN {teamBName}</span>
              </button>
            </div>
          </div>

          {/* Registered Team Rosters */}
          <div className="space-y-3 border-t border-[#333] pt-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>👥 SIGNED UP PLAYERS</span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {signups.length} REGISTERED
              </span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              {/* Team A Roster */}
              <div className="bg-[#0a0a0a] border border-red-500/50 p-3 rounded-none space-y-2 text-left">
                <h5 className="text-[11px] font-bold text-red-400 uppercase tracking-wide border-b border-red-500/30 pb-1 flex items-center justify-between font-mono">
                  <span className="flex items-center gap-1.5">
                    <img src="/red_team.png" alt="" className="w-4 h-4 object-contain shrink-0" />
                    <span>{teamAName}</span>
                  </span>
                  <span className="text-[9px] font-mono text-[#888]">{teamASignups.length}</span>
                </h5>
                <div className="space-y-1 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  {teamASignups.map(s => (
                    <div key={s.id} className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                      <span>⚽</span>
                      <span className="truncate">{s.player?.name || 'Player'}</span>
                    </div>
                  ))}
                  {teamASignups.length === 0 && (
                    <p className="text-[9px] text-[#555] font-mono italic">No players yet</p>
                  )}
                </div>
              </div>

              {/* Team B Roster */}
              <div className="bg-[#0a0a0a] border border-blue-500/50 p-3 rounded-none space-y-2 text-left">
                <h5 className="text-[11px] font-bold text-blue-400 uppercase tracking-wide border-b border-blue-500/30 pb-1 flex items-center justify-between font-mono">
                  <span className="flex items-center gap-1.5">
                    <img src="/blue_team.png" alt="" className="w-4 h-4 object-contain shrink-0" />
                    <span>{teamBName}</span>
                  </span>
                  <span className="text-[9px] font-mono text-[#888]">{teamBSignups.length}</span>
                </h5>
                <div className="space-y-1 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                  {teamBSignups.map(s => (
                    <div key={s.id} className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                      <span>⚽</span>
                      <span className="truncate">{s.player?.name || 'Player'}</span>
                    </div>
                  ))}
                  {teamBSignups.length === 0 && (
                    <p className="text-[9px] text-[#555] font-mono italic">No players yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
