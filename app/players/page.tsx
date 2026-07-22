'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import BadgeCanvasEditor, { BadgePosition } from '@/components/BadgeCanvasEditor'
import VerificationBadge from '@/components/VerificationBadge'
import { FranchiseOwnerBadge } from '@/components/ProfileBanner'

interface Player {
  id: string
  name: string
  position?: string
  photo_url?: string
  available: boolean
  notes?: string
  value?: number
  status: string
  franchise_id?: string | null
  wages?: number
  balance?: number
  passcode?: string
  owned_badge_ids?: string[]
  verification_badge?: string | null
  is_franchise_owner?: boolean | null
  owned_franchise_id?: string | null
  owned_franchise?: {
    id: string
    name: string
    logo_url: string | null
  } | null
  franchises?: {
    id: string
    name: string
    logo_url: string | null
  } | null
  badges?: string[]
  canvas_badge_ids?: string[]
  canvas_badges_data?: BadgePosition[]
}

interface Franchise {
  id: string
  name: string
  logo_url: string | null
}

interface CanvasBadge {
  id: string
  name: string
  image_url: string
}

type Tab = 'active' | 'pending'
type AvailFilter = 'all' | 'available' | 'unavailable'

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('active')
  const [availFilter, setAvailFilter] = useState<AvailFilter>('all')
  const [actioning, setActioning] = useState<string | null>(null)
  const [franchises, setFranchises] = useState<Franchise[]>([])
  
  // Approval modal state
  const [approving, setApproving] = useState<Player | null>(null)
  const [approveValue, setApproveValue] = useState('')
  const [approveFranchiseId, setApproveFranchiseId] = useState<string>('')
  const [approveWages, setApproveWages] = useState('')
  const [approveBalance, setApproveBalance] = useState('')
  const [approvePasscode, setApprovePasscode] = useState('1234')
  const [approveVerification, setApproveVerification] = useState('none')
  const [approveBadges, setApproveBadges] = useState('')
  const [approveCanvasBadgesData, setApproveCanvasBadgesData] = useState<BadgePosition[]>([])
  const [approveIsFranchiseOwner, setApproveIsFranchiseOwner] = useState(false)
  const [approveOwnedFranchiseId, setApproveOwnedFranchiseId] = useState('')

  // Edit modal state
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [editValue, setEditValue] = useState('')
  const [editFranchiseId, setEditFranchiseId] = useState<string>('')
  const [editWages, setEditWages] = useState('')
  const [editBalance, setEditBalance] = useState('')
  const [editPasscode, setEditPasscode] = useState('1234')
  const [editVerification, setEditVerification] = useState('none')
  const [editBadges, setEditBadges] = useState('')
  const [editCanvasBadgesData, setEditCanvasBadgesData] = useState<BadgePosition[]>([])
  const [editIsFranchiseOwner, setEditIsFranchiseOwner] = useState(false)
  const [editOwnedFranchiseId, setEditOwnedFranchiseId] = useState('')
  
  const [canvasBadges, setCanvasBadges] = useState<CanvasBadge[]>([])

  const fetchPlayersAndFranchises = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/players').then(r => r.json()),
      fetch('/api/franchises').then(r => r.json()),
      fetch('/api/canvas-badges').then(r => r.json())
    ])
      .then(([playersData, franchisesData, badgesData]) => {
        setPlayers(playersData.players || [])
        setFranchises(franchisesData.franchises || [])
        setCanvasBadges(badgesData.badges || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { fetchPlayersAndFranchises() }, [])

  const active = players.filter(p => p.status === 'active')
  const pending = players.filter(p => p.status === 'pending')

  const displayedActive = active.filter(p => {
    if (availFilter === 'available') return p.available
    if (availFilter === 'unavailable') return !p.available
    return true
  })

  // Toggle availability (active players only)
  const toggleAvailability = async (player: Player) => {
    setActioning(player.id)
    // Optimistic update
    setPlayers(prev => prev.map(p => p.id === player.id ? { ...p, available: !player.available } : p))
    try {
      await fetch(`/api/players?id=${player.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: !player.available }),
      })
      await fetchPlayersAndFranchises()
    } finally {
      setActioning(null)
    }
  }

  // Reject pending player
  const rejectPlayer = async (id: string) => {
    if (!confirm('Reject and remove this submission?')) return
    setActioning(id)
    // Optimistic update
    setPlayers(prev => prev.filter(p => p.id !== id))
    try {
      await fetch(`/api/players?id=${id}`, { method: 'DELETE' })
      await fetchPlayersAndFranchises()
    } finally {
      setActioning(null)
    }
  }

  // Approve pending player
  const confirmApprove = async () => {
    if (!approving) return
    setActioning(approving.id)
    
    const approveBadgeIds = approveCanvasBadgesData.map(b => b.id)
    const patchData = {
      status: 'active',
      value: approveValue ? parseInt(approveValue) : 0,
      franchise_id: approveFranchiseId || null,
      wages: approveWages ? parseInt(approveWages) : 0,
      balance: approveBalance ? parseInt(approveBalance) : 0,
      passcode: approvePasscode || '1234',
      verification_badge: approveIsFranchiseOwner ? 'red' : (approveVerification || 'none'),
      is_franchise_owner: approveIsFranchiseOwner,
      owned_franchise_id: approveIsFranchiseOwner ? (approveOwnedFranchiseId || null) : null,
      badges: approveBadges.split(',').map(b => b.trim()).filter(b => b),
      canvas_badge_ids: approveBadgeIds,
      canvas_badges_data: approveCanvasBadgesData,
      owned_badge_ids: Array.from(new Set([
        ...(approving.owned_badge_ids || []),
        ...approveBadgeIds
      ]))
    }

    // Optimistic update
    setPlayers(prev => prev.map(p => p.id === approving.id ? { ...p, ...patchData } : p))
    setApproving(null) // Close modal instantly

    try {
      await fetch(`/api/players?id=${approving.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchData),
      })
      
      setApproveValue('')
      setApproveFranchiseId('')
      setApproveWages('')
      setApproveBalance('')
      setApprovePasscode('1234')
      setApproveBadges('')
      setApproveCanvasBadgesData([])
      setApproveIsFranchiseOwner(false)
      setApproveOwnedFranchiseId('')
      await fetchPlayersAndFranchises()
    } catch (err) {
      console.error(err)
      alert("Failed to approve player. Please try again.")
    } finally {
      setActioning(null)
    }
  }

  // Edit active player
  const confirmEdit = async () => {
    if (!editingPlayer) return
    setActioning(editingPlayer.id)

    const editBadgeIds = editCanvasBadgesData.map(b => b.id)
    const patchData = {
      value: editValue ? parseInt(editValue) : 0,
      franchise_id: editFranchiseId || null,
      wages: editWages ? parseInt(editWages) : 0,
      balance: editBalance ? parseInt(editBalance) : 0,
      passcode: editPasscode || '1234',
      verification_badge: editIsFranchiseOwner ? 'red' : (editVerification || 'none'),
      is_franchise_owner: editIsFranchiseOwner,
      owned_franchise_id: editIsFranchiseOwner ? (editOwnedFranchiseId || null) : null,
      badges: editBadges.split(',').map(b => b.trim()).filter(b => b),
      canvas_badge_ids: editBadgeIds,
      canvas_badges_data: editCanvasBadgesData,
      owned_badge_ids: Array.from(new Set([
        ...(editingPlayer.owned_badge_ids || []),
        ...editBadgeIds
      ]))
    }

    // Optimistic update
    setPlayers(prev => prev.map(p => p.id === editingPlayer.id ? { ...p, ...patchData } : p))
    setEditingPlayer(null) // Close modal instantly

    try {
      await fetch(`/api/players?id=${editingPlayer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchData),
      })

      setEditValue('')
      setEditFranchiseId('')
      setEditWages('')
      setEditBalance('')
      setEditPasscode('1234')
      setEditBadges('')
      setEditCanvasBadgesData([])
      setEditIsFranchiseOwner(false)
      setEditOwnedFranchiseId('')
      await fetchPlayersAndFranchises()
    } catch (err) {
      console.error(err)
      alert("Failed to save changes. Please try again.")
    } finally {
      setActioning(null)
    }
  }

  // Delete active player
  const deletePlayer = async (id: string) => {
    if (!confirm('Remove this player?')) return
    setActioning(id)
    await fetch(`/api/players?id=${id}`, { method: 'DELETE' })
    fetchPlayersAndFranchises()
    setActioning(null)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b border-[#1a1a1a]">
        <div>
          <h1 className="text-lg font-bold tracking-wide uppercase">Players</h1>
          {pending.length > 0 && (
            <p className="text-[#f44336] text-xs mt-0.5 font-bold">{pending.length} pending approval</p>
          )}
        </div>
        <Link href="/players/new" className="bg-white text-black text-xs font-bold tracking-widest uppercase px-4 py-2 active:bg-gray-200 transition-colors">
          + Add
        </Link>
      </div>

      {/* Tab Bar */}
      <div className="flex border-b border-[#1a1a1a]">
        <button
          onClick={() => setTab('active')}
          className={`flex-1 py-3 text-[11px] font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5
            ${tab === 'active' ? 'text-white border-b-2 border-white' : 'text-[#555]'}`}
        >
          Active
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${tab === 'active' ? 'bg-[#222] text-white' : 'bg-[#1a1a1a] text-[#555]'}`}>
            {active.length}
          </span>
        </button>
        <button
          onClick={() => setTab('pending')}
          className={`flex-1 py-3 text-[11px] font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5
            ${tab === 'pending' ? 'text-white border-b-2 border-white' : 'text-[#555]'}`}
        >
          Pending
          {pending.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-[#f44336] text-white">
              {pending.length}
            </span>
          )}
        </button>
      </div>

      {/* Availability sub-filter (active tab only) */}
      {tab === 'active' && (
        <div className="flex gap-0 border-b border-[#111] bg-[#0a0a0a]">
          {(['all', 'available', 'unavailable'] as AvailFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setAvailFilter(f)}
              className={`flex-1 py-2 text-[10px] font-bold tracking-widest uppercase transition-colors
                ${availFilter === f ? 'text-white' : 'text-[#444]'}`}
            >
              {f === 'all' ? 'All' : f === 'available' ? 'Available' : 'Signed'}
            </button>
          ))}
        </div>
      )}

      <div className="page-content">
        {loading ? (
          <div className="divide-y divide-[#111]">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 px-4 py-4 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-[#1a1a1a]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-[#1a1a1a] rounded" />
                  <div className="h-3 w-20 bg-[#1a1a1a] rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : tab === 'active' ? (
          displayedActive.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <p className="text-[#555] text-sm">No active players</p>
              <Link href="/players/new" className="mt-3 text-white text-sm underline">Add one →</Link>
            </div>
          ) : (
            <div className="divide-y divide-[#111]">
              {displayedActive.map(player => (
                <ActivePlayerRow
                  key={player.id}
                  player={player}
                  onToggle={toggleAvailability}
                  onEdit={() => {
                    setEditingPlayer(player)
                    setEditValue(player.value ? player.value.toString() : '')
                    setEditFranchiseId(player.franchise_id || '')
                    setEditWages(player.wages ? player.wages.toString() : '0')
                    setEditBalance(player.balance ? player.balance.toString() : '0')
                    setEditPasscode(player.passcode || '1234')
                    setEditVerification(player.verification_badge || 'none')
                    setEditBadges(player.badges ? player.badges.join(', ') : '')
                    setEditCanvasBadgesData(player.canvas_badges_data || (player.canvas_badge_ids?.map(id => ({ id, x: 50, y: 50 })) || []))
                    setEditIsFranchiseOwner(player.is_franchise_owner || false)
                    setEditOwnedFranchiseId(player.owned_franchise_id || '')
                  }}
                  onDelete={deletePlayer}
                  actioning={actioning}
                />
              ))}
            </div>
          )
        ) : (
          pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="text-4xl mb-4">🎉</div>
              <p className="text-[#555] text-sm">No pending submissions</p>
            </div>
          ) : (
            <div className="divide-y divide-[#111]">
              {pending.map(player => (
                <PendingPlayerRow
                  key={player.id}
                  player={player}
                  onApprove={() => { 
                    setApproving(player)
                    setApproveValue('')
                    setApproveFranchiseId('')
                    setApproveWages('')
                    setApproveBalance('')
                    setApprovePasscode('1234')
                    setApproveBadges('')
                    setApproveCanvasBadgesData(player.canvas_badges_data || (player.canvas_badge_ids?.map(id => ({ id, x: 50, y: 50 })) || []))
                    setApproveIsFranchiseOwner(player.is_franchise_owner || false)
                    setApproveOwnedFranchiseId(player.owned_franchise_id || '')
                  }}
                  onReject={rejectPlayer}
                  actioning={actioning}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* Approve Modal */}
      {approving && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setApproving(null)}>
          <div className="w-full max-w-[430px] bg-[#0d0d0d] border border-[#222] p-6 space-y-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div>
              <p className="text-[10px] text-[#555] font-bold tracking-widest uppercase mb-1">Approving</p>
              <p className="text-white font-bold text-base">{approving.name}</p>
              {approving.position && (
                <span className="text-[10px] font-bold text-[#888] border border-[#333] px-1.5 py-0.5 mt-1 inline-block">{approving.position}</span>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#555] tracking-widest uppercase mb-1.5">
                Set Market Value (CR)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={approveValue}
                  onChange={e => setApproveValue(e.target.value)}
                  autoFocus
                  placeholder="e.g. 5000"
                  className="w-full h-11 px-3 pr-10 bg-transparent border border-[#333] text-white text-sm outline-none focus:border-white transition-colors placeholder-[#555]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] text-xs font-bold">CR</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#555] tracking-widest uppercase mb-1.5">
                Assign Franchise
              </label>
              <select
                value={approveFranchiseId}
                onChange={e => setApproveFranchiseId(e.target.value)}
                className="w-full h-11 px-3 bg-transparent border border-[#333] text-white text-sm outline-none focus:border-white transition-colors appearance-none"
              >
                <option value="" className="bg-[#111]">Free Agent (None)</option>
                {franchises.map(f => (
                  <option key={f.id} value={f.id} className="bg-[#111]">
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-[#555] tracking-widest uppercase mb-1.5">
                  Wages (CR/Day)
                </label>
                <input
                  type="number"
                  min="0"
                  value={approveWages}
                  onChange={e => setApproveWages(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full h-11 px-3 bg-transparent border border-[#333] text-white text-sm outline-none focus:border-white transition-colors placeholder-[#555]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#555] tracking-widest uppercase mb-1.5">
                  Initial Wallet Balance (CR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={approveBalance}
                  onChange={e => setApproveBalance(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full h-11 px-3 bg-transparent border border-[#333] text-white text-sm outline-none focus:border-white transition-colors placeholder-[#555]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-[#555] tracking-widest uppercase mb-1.5">
                  Portal Passcode
                </label>
                <input
                  type="text"
                  value={approvePasscode}
                  onChange={e => setApprovePasscode(e.target.value)}
                  placeholder="1234"
                  className="w-full h-11 px-3 bg-transparent border border-[#333] text-white text-sm outline-none focus:border-white transition-colors placeholder-[#555]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#555] tracking-widest uppercase mb-1.5">
                  Verification
                </label>
                <select
                  value={approveVerification}
                  onChange={e => setApproveVerification(e.target.value)}
                  className="w-full h-11 px-3 bg-[#111] border border-[#333] text-white text-sm outline-none focus:border-white transition-colors appearance-none cursor-pointer"
                >
                  <option value="none">None</option>
                  <option value="gold">Gold Checkmark</option>
                  <option value="blue">Blue Checkmark</option>
                  <option value="red">Red Checkmark</option>
                </select>
              </div>
            </div>

            {/* Franchise Owner Special Permission */}
            <div className="pt-2 border-t border-[#1a1a1a] space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={approveIsFranchiseOwner}
                  onChange={e => {
                    const checked = e.target.checked
                    setApproveIsFranchiseOwner(checked)
                    if (checked) {
                      setApproveVerification('red')
                    }
                  }}
                  className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
                  👑 Make Franchise Owner (Red Checkmark)
                </span>
              </label>

              {approveIsFranchiseOwner && (
                <div>
                  <label className="block text-[10px] font-bold text-[#888] tracking-widest uppercase mb-1.5">
                    Select Owned Franchise
                  </label>
                  <select
                    value={approveOwnedFranchiseId}
                    onChange={e => setApproveOwnedFranchiseId(e.target.value)}
                    className="w-full h-11 px-3 bg-[#111] border border-red-500/50 text-white text-sm outline-none focus:border-red-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-[#111]">Select Owned Franchise...</option>
                    {franchises.map(f => (
                      <option key={f.id} value={f.id} className="bg-[#111]">
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#555] tracking-widest uppercase mb-1.5">
                Badges (optional)
              </label>
              <input
                type="text"
                value={approveBadges}
                onChange={e => setApproveBadges(e.target.value)}
                placeholder="e.g. Top Scorer, MVP"
                className="w-full h-11 px-3 bg-transparent border border-[#333] text-white text-sm outline-none focus:border-white transition-colors placeholder-[#555]"
              />
            </div>

            {canvasBadges.length > 0 && (
              <BadgeCanvasEditor
                availableBadges={canvasBadges}
                positions={approveCanvasBadgesData}
                onChange={setApproveCanvasBadgesData}
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setApproving(null)}
                className="flex-1 h-11 border border-[#333] text-[#666] text-xs font-bold tracking-widest uppercase hover:border-white hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                disabled={actioning === approving.id}
                className="flex-1 h-11 bg-white text-black text-xs font-bold tracking-widest uppercase active:bg-gray-200 disabled:opacity-40 transition-colors"
              >
                {actioning === approving.id ? 'Approving...' : 'Approve & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditingPlayer(null)}>
          <div className="w-full max-w-[430px] bg-[#0d0d0d] border border-[#222] p-6 space-y-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div>
              <p className="text-[10px] text-[#555] font-bold tracking-widest uppercase mb-1">Editing</p>
              <p className="text-white font-bold text-base">{editingPlayer.name}</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#555] tracking-widest uppercase mb-1.5">
                Market Value (CR)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full h-11 px-3 pr-10 bg-transparent border border-[#333] text-white text-sm outline-none focus:border-white transition-colors placeholder-[#555]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] text-xs font-bold">CR</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#555] tracking-widest uppercase mb-1.5">
                Assign Franchise
              </label>
              <select
                value={editFranchiseId}
                onChange={e => setEditFranchiseId(e.target.value)}
                className="w-full h-11 px-3 bg-transparent border border-[#333] text-white text-sm outline-none focus:border-white transition-colors appearance-none"
              >
                <option value="" className="bg-[#111]">Free Agent (None)</option>
                {franchises.map(f => (
                  <option key={f.id} value={f.id} className="bg-[#111]">
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-[#555] tracking-widest uppercase mb-1.5">
                  Wages (CR/Day)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editWages}
                  onChange={e => setEditWages(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full h-11 px-3 bg-transparent border border-[#333] text-white text-sm outline-none focus:border-white transition-colors placeholder-[#555]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#555] tracking-widest uppercase mb-1.5">
                  Wallet Balance (CR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editBalance}
                  onChange={e => setEditBalance(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full h-11 px-3 bg-transparent border border-[#333] text-white text-sm outline-none focus:border-white transition-colors placeholder-[#555]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-[#555] tracking-widest uppercase mb-1.5">
                  Portal Passcode
                </label>
                <input
                  type="text"
                  value={editPasscode}
                  onChange={e => setEditPasscode(e.target.value)}
                  placeholder="1234"
                  className="w-full h-11 px-3 bg-transparent border border-[#333] text-white text-sm outline-none focus:border-white transition-colors placeholder-[#555]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#555] tracking-widest uppercase mb-1.5">
                  Verification
                </label>
                <select
                  value={editVerification}
                  onChange={e => setEditVerification(e.target.value)}
                  className="w-full h-11 px-3 bg-[#111] border border-[#333] text-white text-sm outline-none focus:border-white transition-colors appearance-none cursor-pointer"
                >
                  <option value="none">None</option>
                  <option value="gold">Gold Checkmark</option>
                  <option value="blue">Blue Checkmark</option>
                  <option value="red">Red Checkmark</option>
                </select>
              </div>
            </div>

            {/* Franchise Owner Special Permission */}
            <div className="pt-2 border-t border-[#1a1a1a] space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editIsFranchiseOwner}
                  onChange={e => {
                    const checked = e.target.checked
                    setEditIsFranchiseOwner(checked)
                    if (checked) {
                      setEditVerification('red')
                    }
                  }}
                  className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
                  👑 Make Franchise Owner (Red Checkmark)
                </span>
              </label>

              {editIsFranchiseOwner && (
                <div>
                  <label className="block text-[10px] font-bold text-[#888] tracking-widest uppercase mb-1.5">
                    Select Owned Franchise
                  </label>
                  <select
                    value={editOwnedFranchiseId}
                    onChange={e => setEditOwnedFranchiseId(e.target.value)}
                    className="w-full h-11 px-3 bg-[#111] border border-red-500/50 text-white text-sm outline-none focus:border-red-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-[#111]">Select Owned Franchise...</option>
                    {franchises.map(f => (
                      <option key={f.id} value={f.id} className="bg-[#111]">
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#555] tracking-widest uppercase mb-1.5">
                Badges (optional)
              </label>
              <input
                type="text"
                value={editBadges}
                onChange={e => setEditBadges(e.target.value)}
                placeholder="e.g. Top Scorer, MVP"
                className="w-full h-11 px-3 bg-transparent border border-[#333] text-white text-sm outline-none focus:border-white transition-colors placeholder-[#555]"
              />
            </div>

            {canvasBadges.length > 0 && (
              <BadgeCanvasEditor
                availableBadges={canvasBadges}
                positions={editCanvasBadgesData}
                onChange={setEditCanvasBadgesData}
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setEditingPlayer(null)}
                className="flex-1 h-11 border border-[#333] text-[#666] text-xs font-bold tracking-widest uppercase hover:border-white hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmEdit}
                disabled={actioning === editingPlayer.id}
                className="flex-1 h-11 bg-white text-black text-xs font-bold tracking-widest uppercase active:bg-gray-200 disabled:opacity-40 transition-colors"
              >
                {actioning === editingPlayer.id ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}

// ── Active player row ──────────────────────────────────────────
function ActivePlayerRow({ player, onToggle, onEdit, onDelete, actioning }: {
  player: Player
  onToggle: (p: Player) => void
  onEdit: () => void
  onDelete: (id: string) => void
  actioning: string | null
}) {
  const initials = player.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="flex items-center gap-3 px-4 py-4">
      <div className="w-11 h-11 flex-shrink-0 rounded-full overflow-hidden border border-[#222] bg-[#111] flex items-center justify-center">
        {player.photo_url ? (
          <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover object-top" />
        ) : (
          <span className="text-sm font-bold text-[#555]">{initials}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm flex items-center min-w-0">
          <span className="truncate">{player.name}</span>
          <VerificationBadge type={player.verification_badge} className="w-[20px] h-[20px] ml-0.5" />
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
          <FranchiseOwnerBadge isOwner={player.is_franchise_owner} franchiseName={player.owned_franchise?.name} />
          {player.franchises && (
            <div className="flex items-center gap-1 bg-[#111] border border-[#333] px-1.5 py-0.5" title={player.franchises.name}>
              {player.franchises.logo_url ? (
                <img src={player.franchises.logo_url} alt="" className="w-3 h-3 rounded-full object-cover" />
              ) : (
                <span className="text-[8px] font-bold text-[#888]">{player.franchises.name.substring(0, 1)}</span>
              )}
              <span className="text-[10px] font-bold text-white max-w-[60px] truncate">{player.franchises.name}</span>
            </div>
          )}
          {player.position && (
            <span className="text-[10px] font-bold text-[#888] border border-[#333] px-1.5 py-0.5">{player.position}</span>
          )}
          {player.notes && <span className="text-[11px] text-[#555] truncate">{player.notes}</span>}
        </div>
        {player.value !== undefined && player.value > 0 && (
          <p className="text-[#aaa] text-xs font-bold mt-1">
            {player.value.toLocaleString()} <span className="text-[#555] font-normal">CR</span>
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onToggle(player)}
          disabled={actioning === player.id}
          className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 border transition-colors disabled:opacity-40
            ${player.available
              ? 'border-[#2a6b2a] text-[#4caf50] bg-[#0a1f0a]'
              : 'border-[#333] text-[#888] bg-[#111]'
            }`}
        >
          {player.available ? 'AVAILABLE' : 'SIGNED'}
        </button>
        <div className="flex flex-col ml-1">
          <button
            onClick={onEdit}
            disabled={actioning === player.id}
            className="text-[#666] hover:text-white transition-colors disabled:opacity-30 p-1"
            title="Edit Player"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button
            onClick={() => onDelete(player.id)}
            disabled={actioning === player.id}
            className="text-[#666] hover:text-[#ff4444] transition-colors disabled:opacity-30 p-1"
            title="Delete Player"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Pending player row ─────────────────────────────────────────
function PendingPlayerRow({ player, onApprove, onReject, actioning }: {
  player: Player
  onApprove: () => void
  onReject: (id: string) => void
  actioning: string | null
}) {
  const initials = player.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="px-4 py-4 space-y-3">
      <div className="flex items-center gap-3">
        {/* Photo */}
        <div className="w-14 h-14 flex-shrink-0 rounded-full overflow-hidden border border-[#333] bg-[#111] flex items-center justify-center">
          {player.photo_url ? (
            <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover object-top" />
          ) : (
            <span className="text-base font-bold text-[#555]">{initials}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{player.name}</p>
            <VerificationBadge type={player.verification_badge} className="w-[20px] h-[20px] ml-0.5" />
            <span className="text-[9px] font-bold text-[#f5a623] border border-[#f5a623]/40 bg-[#f5a623]/10 px-1.5 py-0.5 uppercase tracking-widest flex-shrink-0">Pending</span>
          </div>
          {player.position && (
            <span className="text-[10px] font-bold text-[#888] border border-[#333] px-1.5 py-0.5 mt-1 inline-block">{player.position}</span>
          )}
          {player.notes && <p className="text-[#555] text-xs mt-1 italic">{player.notes}</p>}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pl-[68px]">
        <button
          onClick={() => onReject(player.id)}
          disabled={actioning === player.id}
          className="flex-1 h-9 border border-[#6b2a2a] text-[#f44336] text-[10px] font-bold tracking-widest uppercase hover:bg-[#1f0a0a] transition-colors disabled:opacity-40"
        >
          Reject
        </button>
        <button
          onClick={onApprove}
          disabled={actioning === player.id}
          className="flex-1 h-9 bg-white text-black text-[10px] font-bold tracking-widest uppercase active:bg-gray-200 transition-colors disabled:opacity-40"
        >
          Approve →
        </button>
      </div>
    </div>
  )
}
