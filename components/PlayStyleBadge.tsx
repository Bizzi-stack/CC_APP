'use client'

import React, { useState, useEffect } from 'react'
import { getPlayStyle, PlayStyleDef } from '@/lib/playstyles'

interface PlayStyleBadgeProps {
  styleNameOrId: string
  compact?: boolean
  graphicOnly?: boolean
  showTooltip?: boolean
  className?: string
}

export default function PlayStyleBadge({
  styleNameOrId,
  compact = false,
  graphicOnly = false,
  showTooltip = true,
  className = ''
}: PlayStyleBadgeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const playStyle = getPlayStyle(styleNameOrId)

  // Close modal when pressing Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Fallback if not a mapped Playstyle
  if (!playStyle) {
    return (
      <span className={`inline-flex items-center text-[10px] font-bold text-white border border-[#333] bg-black/60 px-1.5 py-0.5 uppercase shrink-0 ${className}`}>
        {styleNameOrId}
      </span>
    )
  }

  const handleToggle = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(prev => !prev)
  }

  return (
    <>
      {graphicOnly ? (
        /* Standalone Graphic PNG Only (larger dimensions matching Market Value box height) */
        <button
          type="button"
          onClick={handleToggle}
          onTouchEnd={handleToggle}
          className={`inline-flex items-center justify-center p-1 rounded-lg bg-black/40 border border-amber-500/30 hover:border-amber-400 hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer shadow-lg ${className}`}
          title={`${playStyle.name}: Tap to view PlayStyle details`}
        >
          <img
            src={playStyle.imageUrl}
            alt={playStyle.name}
            className="w-10 h-10 object-contain filter drop-shadow-md shrink-0"
          />
        </button>
      ) : (
        /* Rectangular Clean Badge matching Country/Franchise/Position style */
        <button
          type="button"
          onClick={handleToggle}
          onTouchEnd={handleToggle}
          className={`inline-flex items-center gap-1.5 bg-black/60 border border-[#333] hover:border-amber-500/60 px-1.5 py-0.5 text-[10px] font-bold uppercase transition-all shrink-0 cursor-pointer active:scale-95 ${className}`}
          title={`${playStyle.name}: Tap to view PlayStyle details`}
        >
          <img
            src={playStyle.imageUrl}
            alt={playStyle.name}
            className="w-3.5 h-3.5 object-contain filter drop-shadow shrink-0"
          />
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
            {playStyle.name}
          </span>
        </button>
      )}

      {/* Interactive Modal Popover on Tap / Click */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setIsOpen(false)
          }}
        >
          <div
            className="relative w-full max-w-xs bg-[#0b0b0b] border border-amber-500/40 p-4 rounded-xl shadow-2xl space-y-3 text-left"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#222] pb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-black border border-amber-500/40 flex items-center justify-center p-1 shadow-inner">
                  <img src={playStyle.imageUrl} alt={playStyle.name} className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-amber-300 tracking-wider">
                    {playStyle.name}
                  </h3>
                  <span className="text-[9px] font-mono text-[#888] uppercase tracking-widest">
                    {playStyle.category} PlayStyle
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsOpen(false)
                }}
                className="w-7 h-7 rounded-full bg-[#1c1c1c] hover:bg-[#333] text-[#aaa] hover:text-white flex items-center justify-center text-xs font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-[#ccc] leading-relaxed font-normal">
              {playStyle.description}
            </p>

            {/* Action footer hint */}
            <div className="pt-1 text-[9px] text-[#666] font-mono uppercase tracking-wider text-right">
              Tap anywhere to close
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function PlayStylesList({
  badges,
  compact = false,
  graphicOnly = false
}: {
  badges?: string[] | null
  compact?: boolean
  graphicOnly?: boolean
}) {
  if (!badges || badges.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      {badges.map((badge, idx) => (
        <PlayStyleBadge
          key={`${badge}-${idx}`}
          styleNameOrId={badge}
          compact={compact}
          graphicOnly={graphicOnly}
        />
      ))}
    </div>
  )
}
