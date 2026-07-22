'use client'

import React from 'react'

export interface ProfileBannerProps {
  banner_url?: string | null
  instagram_url?: string | null
  spotify_track_url?: string | null
  is_business?: boolean | null
  business_name?: string | null
  className?: string
}

export function getSpotifyEmbedUrl(url?: string | null): string | null {
  if (!url) return null
  const clean = url.trim()
  // Matches track ID from open.spotify.com/track/ID or spotify:track:ID
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

export default function ProfileBanner({
  banner_url,
  instagram_url,
  spotify_track_url,
  is_business,
  business_name,
  className = ''
}: ProfileBannerProps) {
  const igUrl = formatInstagramUrl(instagram_url)
  const spotifyEmbedUrl = getSpotifyEmbedUrl(spotify_track_url)

  return (
    <div className={`w-full flex flex-col gap-2 ${className}`}>
      {/* Main Banner Graphic Box */}
      <div className="relative w-full h-36 sm:h-44 rounded-xl overflow-hidden border border-[#222] bg-[#0c0c0c] flex flex-col justify-between p-3 group shadow-2xl">
        {/* Background Image or Stylish Default Gradient */}
        {banner_url ? (
          <img
            src={banner_url}
            alt="Profile Banner"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#1f1f1f] to-[#0a0a0a]">
            {/* Subtle grid pattern background */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
                backgroundSize: '16px 16px'
              }}
            />
          </div>
        )}

        {/* Gradient overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 pointer-events-none" />

        {/* Top bar: Business Badge & IG Link */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          {/* Business Owner Tag */}
          {is_business ? (
            <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1.5 border border-yellow-300/40">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 21h18M3 7v14M21 7v14M6 21V11M10 21V11M14 21V11M18 21V11M12 3l9 4H3l9-4z" />
              </svg>
              <span>{business_name || 'Business Partner'}</span>
            </div>
          ) : (
            <div />
          )}

          {/* Instagram Button */}
          {igUrl && (
            <a
              href={igUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:brightness-110 text-white text-[10px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl transition-all active:scale-95 ml-auto"
              title="Visit Instagram Profile"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              <span>Instagram</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}
        </div>

        {/* Bottom Banner Title / Label if business or custom banner */}
        <div className="relative z-10 flex justify-between items-end">
          {banner_url && !is_business && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/70 bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
              Official Banner
            </span>
          )}
        </div>
      </div>

      {/* Embedded Spotify Track Music Player */}
      {spotifyEmbedUrl && (
        <div className="w-full rounded-xl overflow-hidden border border-[#222] bg-black shadow-lg">
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
      )}
    </div>
  )
}
