'use client'

import React from 'react'

export interface ProfileBannerProps {
  instagram_url?: string | null
  spotify_track_url?: string | null
  is_business?: boolean | null
  business_name?: string | null
  className?: string
}

export function getSpotifyEmbedUrl(url?: string | null): string | null {
  if (!url) return null
  const clean = url.trim()
  const match = clean.match(/track[\/:]([a-zA-Z0-9]+)/)
  if (match && match[1]) {
    return `https://open.spotify.com/embed/track/${match[1]}?utm_source=generator&theme=0`
  }
  return null
}

export function formatInstagramUrl(urlOrHandle?: string | null): string | null {
  if (!urlOrHandle) return null
  let clean = urlOrHandle.trim()
  if (!clean) return null
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean
  }
  clean = clean.replace(/^@/, '')
  return `https://instagram.com/${clean}`
}

export function InstagramBadge({ url }: { url?: string | null }) {
  const igUrl = formatInstagramUrl(url)
  if (!igUrl) return null

  return (
    <a
      href={igUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={e => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:brightness-110 text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md shadow-md transition-all active:scale-95 shrink-0"
      title="Visit Instagram Profile"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
      <span>Instagram</span>
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </a>
  )
}

export function BusinessBadge({ isBusiness, businessName }: { isBusiness?: boolean | null; businessName?: string | null }) {
  if (!isBusiness) return null

  return (
    <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-md border border-yellow-300/40 shrink-0">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M3 21h18M3 7v14M21 7v14M6 21V11M10 21V11M14 21V11M18 21V11M12 3l9 4H3l9-4z" />
      </svg>
      <span>{businessName || 'Business Owner'}</span>
    </div>
  )
}

export function SpotifyPlayer({ url }: { url?: string | null }) {
  const spotifyEmbedUrl = getSpotifyEmbedUrl(url)
  if (!spotifyEmbedUrl) return null

  return (
    <div className="w-full rounded-xl overflow-hidden border border-[#222] bg-black shadow-lg my-2">
      <iframe
        src={spotifyEmbedUrl}
        width="100%"
        height="80"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        className="w-full block"
        title="Spotify Music Track"
      />
    </div>
  )
}

export default function ProfileBanner({
  instagram_url,
  spotify_track_url,
  is_business,
  business_name,
  className = ''
}: ProfileBannerProps) {
  const igUrl = formatInstagramUrl(instagram_url)
  const spotifyEmbedUrl = getSpotifyEmbedUrl(spotify_track_url)

  if (!igUrl && !is_business && !spotifyEmbedUrl) return null

  return (
    <div className={`w-full flex flex-col gap-2 ${className}`}>
      {/* Inline Badges Row */}
      {(is_business || igUrl) && (
        <div className="flex flex-wrap items-center gap-2">
          <BusinessBadge isBusiness={is_business} businessName={business_name} />
          <InstagramBadge url={instagram_url} />
        </div>
      )}

      {/* Spotify Track Music Player */}
      <SpotifyPlayer url={spotify_track_url} />
    </div>
  )
}
