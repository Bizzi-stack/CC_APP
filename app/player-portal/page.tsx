'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BadgeCanvasEditor, { BadgePosition } from '@/components/BadgeCanvasEditor'
import VerificationBadge from '@/components/VerificationBadge'
import ProfileBanner, { BusinessBadge, InstagramBadge, SpotifyPlayer, FranchiseOwnerBadge } from '@/components/ProfileBanner'

interface CanvasBadge {
  id: string
  name: string
  image_url: string
  owner_id?: string | null
  price: number
  is_listed: boolean
  owner?: {
    name: string
  } | null
}

interface Player {
  id: string
  name: string
  position?: string
  photo_url?: string
  wages: number
  balance: number
  available: boolean
  last_wage_collection?: string | null
  verification_badge?: string | null
  banner_url?: string | null
  instagram_url?: string | null
  spotify_track_url?: string | null
  is_business?: boolean | null
  business_name?: string | null
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
  owned_badge_ids?: string[]
  canvas_badge_ids?: string[]
  canvas_badges_data?: BadgePosition[]
}

export default function PlayerPortalPage() {
  const router = useRouter()
  const [player, setPlayer] = useState<Player | null>(null)
  const [canvasBadges, setCanvasBadges] = useState<CanvasBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [buying, setBuying] = useState<string | null>(null)
  const [savingCanvas, setSavingCanvas] = useState(false)
  const [shopTab, setShopTab] = useState<'shop' | 'collection'>('shop')
  const [listingBadge, setListingBadge] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Banner & Profile Customization State
  const [bannerUrl, setBannerUrl] = useState('')
  const [instagramUrl, setInstagramUrl] = useState('')
  const [spotifyTrackUrl, setSpotifyTrackUrl] = useState('')
  const [isBusiness, setIsBusiness] = useState(false)
  const [businessName, setBusinessName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)

  // Canvas positions state
  const [canvasPositions, setCanvasPositions] = useState<BadgePosition[]>([])

  useEffect(() => {
    fetchPortalData()
  }, [])

  const fetchPortalData = async () => {
    try {
      const [meRes, badgesRes] = await Promise.all([
        fetch('/api/player/me'),
        fetch('/api/canvas-badges')
      ])

      if (!meRes.ok) {
        if (meRes.status === 401) {
          router.push('/player-login')
          return
        }
        throw new Error('Failed to fetch player profile')
      }

      const meData = await meRes.json()
      const badgesData = await badgesRes.json()

      const curPlayer = meData.player
      setPlayer(curPlayer)
      setCanvasPositions(curPlayer.canvas_badges_data || [])
      setCanvasBadges(badgesData.badges || [])
      setBannerUrl(curPlayer.banner_url || '')
      setInstagramUrl(curPlayer.instagram_url || '')
      setSpotifyTrackUrl(curPlayer.spotify_track_url || '')
      setIsBusiness(Boolean(curPlayer.is_business))
      setBusinessName(curPlayer.business_name || '')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('Banner image must be under 10MB')
      return
    }
    setUploadingBanner(true)
    setError('')
    try {
      const uploadForm = new FormData()
      uploadForm.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: uploadForm })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Banner upload failed')
      setBannerUrl(data.url)
      setSuccessMsg('Banner uploaded! Click "Save Profile Changes" below to publish.')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploadingBanner(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setError('')
    setSuccessMsg('')
    try {
      const res = await fetch('/api/player/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          banner_url: bannerUrl || null,
          instagram_url: instagramUrl || null,
          spotify_track_url: spotifyTrackUrl || null,
          is_business: isBusiness,
          business_name: businessName || null
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save profile customization')
      setSuccessMsg('Profile customization saved successfully!')
      await fetchPortalData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleCollectWages = async () => {
    setClaiming(true)
    setError('')
    setSuccessMsg('')
    try {
      const res = await fetch('/api/player/wages', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to collect wages')
      }

      setSuccessMsg(`Successfully collected wages of ${data.collected.toLocaleString()} CR!`)
      await fetchPortalData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setClaiming(false)
    }
  }

  const handleBuyBadge = async (badgeId: string, badgeName: string) => {
    if (!confirm(`Do you want to purchase the "${badgeName}" badge for 5,000 CR?`)) {
      return
    }

    setBuying(badgeId)
    setError('')
    setSuccessMsg('')
    try {
      const res = await fetch('/api/player/buy-badge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badgeId })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to purchase badge')
      }

      setSuccessMsg(`Purchased "${badgeName}" successfully!`)
      await fetchPortalData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBuying(null)
    }
  }

  const handleSaveCanvas = async () => {
    setSavingCanvas(true)
    setError('')
    setSuccessMsg('')
    try {
      const res = await fetch('/api/player/canvas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvasBadgesData: canvasPositions })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save canvas layout')
      }

      setSuccessMsg('Canvas layout saved successfully!')
      await fetchPortalData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingCanvas(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/player/logout', { method: 'POST' })
      router.push('/home')
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  const handleListBadge = async (badgeId: string, currentPrice: number) => {
    const priceStr = prompt(`Enter resale price (Credits) for this badge:`, currentPrice.toString())
    if (priceStr === null) return
    const price = parseInt(priceStr)
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid positive number for the price.')
      return
    }

    setListingBadge(badgeId)
    setError('')
    setSuccessMsg('')
    try {
      const res = await fetch('/api/player/list-badge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badgeId, action: 'list', price })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to list badge')
      }
      setSuccessMsg('Badge listed for sale in the marketplace!')
      await fetchPortalData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setListingBadge(null)
    }
  }

  const handleUnlistBadge = async (badgeId: string) => {
    if (!confirm('Are you sure you want to remove this badge from the marketplace?')) {
      return
    }

    setListingBadge(badgeId)
    setError('')
    setSuccessMsg('')
    try {
      const res = await fetch('/api/player/list-badge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badgeId, action: 'unlist' })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to unlist badge')
      }
      setSuccessMsg('Badge removed from the marketplace.')
      await fetchPortalData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setListingBadge(null)
    }
  }

  // Filter badges owned by the player and active market listings
  const ownedBadges = canvasBadges.filter(b => b.owner_id === player?.id)
  const marketBadges = canvasBadges.filter(b => b.is_listed && b.owner_id !== player?.id)
  const ownedBadgeIds = ownedBadges.map(b => b.id)

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
        <div className="text-center text-[#555] text-sm tracking-wider uppercase animate-pulse">
          Loading player profile...
        </div>
      </div>
    )
  }

  if (error && !player) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <div className="border border-[#ff4444] bg-[#ff4444]/10 text-[#ff4444] p-6 max-w-sm text-center">
          <p className="text-sm font-bold uppercase tracking-wider mb-4">Error loading portal</p>
          <p className="text-xs mb-6 text-gray-400">{error}</p>
          <Link href="/player-login" className="bg-white text-black px-4 py-2 font-bold text-xs uppercase tracking-wider">
            Re-authenticate
          </Link>
        </div>
      </div>
    )
  }

  // Calculate claims countdown info
  const nextClaimTime = player?.last_wage_collection 
    ? new Date(new Date(player.last_wage_collection).getTime() + 24 * 60 * 60 * 1000)
    : null
  const canClaim = !nextClaimTime || new Date() >= nextClaimTime

  return (
    <div className="min-h-screen bg-black text-white pb-24 max-w-[430px] mx-auto border-x border-[#222]">
      {/* Header Banner */}
      <div className="bg-[#050505] border-b border-[#222] p-6 pt-12 relative">
        <div className="flex items-center justify-between mb-6">
          <Link href="/home" className="text-[#888] hover:text-white transition-colors text-xs font-bold uppercase tracking-wider">
            ← Home
          </Link>
          <button onClick={handleLogout} className="text-[#ff4444] text-xs font-bold uppercase tracking-wider active:opacity-60">
            Sign Out
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full border border-[#333] bg-[#111] overflow-hidden flex items-center justify-center shrink-0">
            {player?.photo_url ? (
              <img src={player.photo_url} alt={player.name} className="w-full h-full object-cover object-top" />
            ) : (
              <span className="text-[#555] text-xl font-bold uppercase">{player?.name.substring(0, 2)}</span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold flex items-center min-w-0">
              <span className="truncate">{player?.name}</span>
              <VerificationBadge type={player?.verification_badge} className="w-[22px] h-[22px] ml-0.5" />
            </h1>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <FranchiseOwnerBadge isOwner={player?.is_franchise_owner} franchiseName={player?.owned_franchise?.name} />
              <BusinessBadge isBusiness={isBusiness} businessName={businessName || player?.business_name} />
              <InstagramBadge url={instagramUrl || player?.instagram_url} />
              <span className="text-[9px] font-bold text-[#888] border border-[#2a2a2a] px-1 py-0.5 uppercase">
                {player?.position || 'Unassigned'}
              </span>
              {player?.franchises && (
                <span className="text-[9px] text-[#555] border border-[#111] px-1 py-0.5 uppercase">
                  Signed: {player.franchises.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Franchise Owner Special Access Quick Button */}
        {player?.is_franchise_owner && (
          <div className="mt-4 p-3 bg-gradient-to-r from-red-950/40 via-black to-red-950/40 border border-red-800/40 rounded-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-base">👑</span>
              <div>
                <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Franchise Owner Access</p>
                <p className="text-[10px] text-[#888]">Manage {player?.owned_franchise?.name || 'your franchise'} portal</p>
              </div>
            </div>
            <Link
              href="/franchise-portal"
              className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded transition-colors shrink-0"
            >
              Open Portal →
            </Link>
          </div>
        )}

        {/* Embedded Spotify Track Player if provided */}
        {(spotifyTrackUrl || player?.spotify_track_url) && (
          <div className="mt-4">
            <SpotifyPlayer url={spotifyTrackUrl || player?.spotify_track_url} />
          </div>
        )}

        {/* Financial info cards */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="bg-black border border-[#222] p-4">
            <p className="text-[9px] text-[#666] font-bold tracking-widest uppercase mb-1">Your Wallet</p>
            <p className="text-white text-lg font-mono font-bold">
              {player?.balance.toLocaleString()} <span className="text-xs text-[#555] font-sans font-normal">CR</span>
            </p>
          </div>
          <div className="bg-black border border-[#222] p-4">
            <p className="text-[9px] text-[#666] font-bold tracking-widest uppercase mb-1">Current Wage</p>
            <p className="text-white text-lg font-mono font-bold">
              {player?.wages.toLocaleString()} <span className="text-xs text-[#555] font-sans font-normal">CR/Day</span>
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {error && (
          <div className="bg-[#ff4444]/10 border border-[#ff4444] text-[#ff4444] p-3 text-xs text-center uppercase tracking-wider">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-[#4caf50]/10 border border-[#4caf50] text-[#4caf50] p-3 text-xs text-center uppercase tracking-wider">
            {successMsg}
          </div>
        )}

        {/* Claim daily wages card */}
        {player?.wages && player.wages > 0 ? (
          <div className="bg-[#050505] border border-[#222] p-4 text-center space-y-4">
            <h2 className="text-[10px] text-[#666] font-bold tracking-widest uppercase">Wage Collection Center</h2>
            {canClaim ? (
              <div className="space-y-3">
                <p className="text-xs text-[#aaa]">Your daily wage is ready to be collected!</p>
                <button
                  disabled={claiming}
                  onClick={handleCollectWages}
                  className="w-full bg-white text-black font-bold uppercase tracking-widest text-[10px] py-3 active:opacity-60 transition-opacity"
                >
                  {claiming ? 'Collecting...' : `Collect Daily Wages (+${player.wages.toLocaleString()} CR)`}
                </button>
              </div>
            ) : (
              <div className="space-y-1 py-1">
                <p className="text-[#ffb74d] text-xs font-bold uppercase tracking-wider">Wages Already Claimed Today</p>
                <p className="text-[10px] text-[#555] uppercase">Next collection is available in less than 24 hours.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="border border-[#222] bg-[#050505] p-5 text-center text-[#555] text-xs uppercase tracking-wider">
            You are a Free Agent. Sign to a team to earn weekly wages!
          </div>
        )}

        {/* Profile & Banner Customization Form */}
        <form onSubmit={handleSaveProfile} className="bg-[#050505] border border-[#222] p-5 space-y-4 rounded-xl">
          <h2 className="text-xs font-bold tracking-widest uppercase text-white border-b border-[#222] pb-2 flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Instagram, Spotify & Business Setup
          </h2>

          {/* Instagram URL or Handle */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold tracking-widest uppercase text-[#888] block">
              Instagram Profile Link / Handle
            </label>
            <input
              type="text"
              value={instagramUrl}
              onChange={e => setInstagramUrl(e.target.value)}
              placeholder="e.g. @your_username or https://instagram.com/..."
              className="w-full h-10 px-3 bg-black border border-[#333] text-white text-xs outline-none focus:border-white transition-colors"
            />
          </div>

          {/* Spotify Track URL */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-bold tracking-widest uppercase text-[#888] block">
              Spotify Signature Song (Track Link)
            </label>
            <input
              type="text"
              value={spotifyTrackUrl}
              onChange={e => setSpotifyTrackUrl(e.target.value)}
              placeholder="https://open.spotify.com/track/..."
              className="w-full h-10 px-3 bg-black border border-[#333] text-white text-xs outline-none focus:border-white transition-colors"
            />
            <p className="text-[8px] text-[#555]">
              Copy link to track from Spotify. Visitors can play your track preview directly from your banner!
            </p>
          </div>

          {/* Business Owner Toggle */}
          <div className="pt-2 border-t border-[#1a1a1a] space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isBusiness}
                onChange={e => setIsBusiness(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Enable Business Owner Banner Tag
              </span>
            </label>

            {isBusiness && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold tracking-widest uppercase text-[#888] block">
                  Business / Brand Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="e.g. Apex Football Academy"
                  className="w-full h-10 px-3 bg-black border border-[#333] text-white text-xs outline-none focus:border-white transition-colors"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="w-full h-10 bg-white hover:bg-gray-200 text-black text-xs font-bold uppercase tracking-widest transition-colors active:opacity-60 disabled:opacity-40 mt-2"
          >
            {savingProfile ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>

        {/* Snapping canvas editor */}
        <div className="space-y-4 border-t border-[#111] pt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold tracking-widest uppercase text-white">Your Avatar Canvas</h2>
            {canvasPositions.length > 0 && (
              <button
                disabled={savingCanvas}
                onClick={handleSaveCanvas}
                className="bg-white text-black text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 hover:bg-gray-200 active:opacity-60 transition-colors"
              >
                {savingCanvas ? 'Saving...' : 'Save Layout'}
              </button>
            )}
          </div>

          {ownedBadges.length > 0 ? (
            <BadgeCanvasEditor
              availableBadges={ownedBadges}
              positions={canvasPositions}
              onChange={setCanvasPositions}
            />
          ) : (
            <div className="border border-[#222] border-dashed p-6 text-center text-[#555] text-xs uppercase tracking-wider leading-relaxed">
              No badges owned yet. Buy badges from the Sticker Shop below to customize your canvas!
            </div>
          )}
        </div>

        {/* Badge Shop / Marketplace */}
        <div className="space-y-4 border-t border-[#111] pt-6">
          <div className="flex items-center justify-between border-b border-[#111] pb-2">
            <h2 className="text-xs font-bold tracking-widest uppercase text-white">Stickers Market</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShopTab('shop')}
                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 transition-all ${
                  shopTab === 'shop'
                    ? 'bg-white text-black'
                    : 'text-[#555] hover:text-white border border-[#222]'
                }`}
              >
                Marketplace
              </button>
              <button
                onClick={() => setShopTab('collection')}
                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 transition-all ${
                  shopTab === 'collection'
                    ? 'bg-white text-black'
                    : 'text-[#555] hover:text-white border border-[#222]'
                }`}
              >
                My Collection ({ownedBadges.length})
              </button>
            </div>
          </div>

          {shopTab === 'shop' ? (
            marketBadges.length === 0 ? (
              <div className="border border-[#222] bg-[#050505] p-6 text-center text-[#555] text-xs uppercase tracking-wider">
                No stickers listed for sale right now.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {marketBadges.map(badge => {
                  const canAfford = (player?.balance ?? 0) >= badge.price
                  const isResale = badge.owner_id !== null
                  return (
                    <div key={badge.id} className="border border-[#222] bg-[#0a0a0a] p-3 flex flex-col items-center justify-between gap-3 text-center relative overflow-hidden">
                      {isResale && (
                        <div className="absolute top-1 right-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[6px] font-bold px-1 uppercase tracking-wider">
                          Resale
                        </div>
                      )}
                      <div className="w-16 h-16 flex items-center justify-center p-1 bg-[#111] border border-[#222] rounded overflow-hidden">
                        <img src={badge.image_url} alt={badge.name} className="w-full h-full object-contain filter drop-shadow-md" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-xs text-white truncate max-w-[150px]">{badge.name}</h4>
                        <p className="text-[10px] text-[#ffb74d] font-mono font-bold">{badge.price.toLocaleString()} CR</p>
                        {isResale && badge.owner && (
                          <p className="text-[7px] text-[#666] uppercase truncate max-w-[130px]">Seller: {badge.owner.name}</p>
                        )}
                      </div>

                      <button
                        disabled={buying !== null || !canAfford}
                        onClick={() => handleBuyBadge(badge.id, badge.name)}
                        className={`w-full text-[9px] font-bold uppercase tracking-widest py-1.5 transition-all
                          ${canAfford
                            ? 'bg-white text-black hover:bg-gray-200 active:opacity-60'
                            : 'border border-[#222] text-[#333] bg-[#050505] cursor-not-allowed'}`}
                      >
                        {buying === badge.id ? '...' : canAfford ? 'Buy' : 'Insufficient'}
                      </button>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            ownedBadges.length === 0 ? (
              <div className="border border-[#222] bg-[#050505] p-6 text-center text-[#555] text-xs uppercase tracking-wider">
                You do not own any stickers yet.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {ownedBadges.map(badge => {
                  const isListed = badge.is_listed
                  return (
                    <div key={badge.id} className="border border-[#222] bg-[#0a0a0a] p-3 flex flex-col items-center justify-between gap-3 text-center relative">
                      <div className="w-16 h-16 flex items-center justify-center p-1 bg-[#111] border border-[#222] rounded overflow-hidden">
                        <img src={badge.image_url} alt={badge.name} className="w-full h-full object-contain filter drop-shadow-md" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-xs text-white truncate max-w-[150px]">{badge.name}</h4>
                        {isListed ? (
                          <p className="text-[9px] text-[#ff4444] uppercase tracking-wider font-bold">Listed: {badge.price.toLocaleString()} CR</p>
                        ) : (
                          <p className="text-[9px] text-[#555] uppercase tracking-wider">In Collection</p>
                        )}
                      </div>

                      {isListed ? (
                        <button
                          disabled={listingBadge !== null}
                          onClick={() => handleUnlistBadge(badge.id)}
                          className="w-full border border-[#ff4444]/30 hover:border-[#ff4444] text-[#ff4444] text-[9px] font-bold uppercase tracking-widest py-1.5 bg-black transition-all active:opacity-60"
                        >
                          {listingBadge === badge.id ? '...' : 'Unlist'}
                        </button>
                      ) : (
                        <button
                          disabled={listingBadge !== null}
                          onClick={() => handleListBadge(badge.id, badge.price)}
                          className="w-full bg-[#111] hover:bg-[#1a1a1a] text-white border border-[#333] text-[9px] font-bold uppercase tracking-widest py-1.5 transition-all active:opacity-60"
                        >
                          {listingBadge === badge.id ? '...' : 'Sell Sticker'}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
