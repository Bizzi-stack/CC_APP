'use client'

import React from 'react'
import { getPlayStyle, PlayStyleDef, PLAYSTYLES_LIST } from '@/lib/playstyles'

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

  // Fallback if not a mapped FIFA playstyle
  if (!playStyle) {
    return (
      <span className={`inline-flex items-center text-[10px] font-bold text-white border border-[#444] bg-[#111] px-2 py-0.5 rounded shadow-sm ${className}`}>
        {styleNameOrId}
      </span>
    )
  }

  return (
    <div
      className={`group relative inline-flex items-center gap-1.5 bg-gradient-to-r ${playStyle.bgGradient} ${playStyle.borderColor} border shadow-md rounded-md px-2 py-0.5 transition-all hover:scale-105 shrink-0 ${className}`}
      title={showTooltip ? `${playStyle.name} (${playStyle.category}): ${playStyle.description}` : playStyle.name}
    >
      {/* FIFA PlayStyle Diamond Icon */}
      <div className={`w-3.5 h-3.5 rounded-sm bg-black/60 border ${playStyle.borderColor} flex items-center justify-center rotate-45 shrink-0 shadow-inner`}>
        <svg
          width="8"
          height="8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`${playStyle.textColor} -rotate-45`}
        >
          <path d={playStyle.iconSvg} />
        </svg>
      </div>

      {/* Label */}
      <span className={`text-[9px] font-extrabold uppercase tracking-wider ${playStyle.textColor}`}>
        {playStyle.name}
      </span>

      {/* Optional Hover Card Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-48 p-2.5 bg-black/95 border border-[#333] rounded-lg shadow-2xl backdrop-blur-md text-left pointer-events-none">
          <div className="flex items-center justify-between border-b border-[#222] pb-1 mb-1">
            <span className={`text-[10px] font-bold uppercase ${playStyle.textColor}`}>
              {playStyle.name}
            </span>
            <span className="text-[8px] font-mono text-[#777] uppercase">{playStyle.category}</span>
          </div>
          <p className="text-[9px] text-[#aaa] leading-tight font-normal">{playStyle.description}</p>
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
