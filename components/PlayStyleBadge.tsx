'use client'

import React from 'react'
import { getPlayStyle, PlayStyleDef } from '@/lib/playstyles'

interface PlayStyleBadgeProps {
  styleNameOrId: string
  compact?: boolean
  showTooltip?: boolean
  className?: string
}

export default function PlayStyleBadge({
  styleNameOrId,
  compact = false,
  showTooltip = true,
  className = ''
}: PlayStyleBadgeProps) {
  const playStyle = getPlayStyle(styleNameOrId)

  // Fallback if not a mapped Playstyle
  if (!playStyle) {
    return (
      <span className={`inline-flex items-center text-[10px] font-bold text-white border border-[#444] bg-[#111] px-2 py-0.5 rounded shadow-sm ${className}`}>
        {styleNameOrId}
      </span>
    )
  }

  return (
    <div
      className={`group relative inline-flex items-center gap-1.5 bg-black/80 border border-amber-500/30 shadow-md rounded-md px-2 py-0.5 transition-all hover:scale-105 shrink-0 ${className}`}
      title={showTooltip ? `${playStyle.name} (${playStyle.category}): ${playStyle.description}` : playStyle.name}
    >
      {/* PlayStyle PNG Image Graphic */}
      <img
        src={playStyle.imageUrl}
        alt={playStyle.name}
        className="w-5 h-5 object-contain filter drop-shadow shrink-0"
      />

      {/* Label */}
      <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-300">
        {playStyle.name}
      </span>

      {/* Optional Hover Card Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-52 p-2.5 bg-black/95 border border-amber-500/40 rounded-lg shadow-2xl backdrop-blur-md text-left pointer-events-none">
          <div className="flex items-center gap-2 border-b border-[#222] pb-1.5 mb-1.5">
            <img src={playStyle.imageUrl} alt="" className="w-6 h-6 object-contain" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase text-amber-300 truncate">{playStyle.name}</p>
              <p className="text-[8px] font-mono text-[#888] uppercase">{playStyle.category}</p>
            </div>
          </div>
          <p className="text-[9px] text-[#bbb] leading-tight font-normal">{playStyle.description}</p>
        </div>
      )}
    </div>
  )
}

export function PlayStylesList({ badges, compact = false }: { badges?: string[] | null; compact?: boolean }) {
  if (!badges || badges.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {badges.map((badge, idx) => (
        <PlayStyleBadge key={`${badge}-${idx}`} styleNameOrId={badge} compact={compact} />
      ))}
    </div>
  )
}
