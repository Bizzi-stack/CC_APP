'use client'

import React from 'react'

export function TopScorerBadge({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 p-0.5 rounded-lg shadow-lg border border-amber-300/60 group cursor-pointer ${className}`}
      title="🔥 League Top Scorer (Golden Boot Winner)"
    >
      <div className="w-full h-full bg-black rounded-[6px] flex items-center justify-center font-bold text-amber-300 text-xs">
        <span className="text-sm select-none">⚽</span>
      </div>
      <div className="absolute -top-1 -right-1 bg-amber-400 text-black text-[7px] font-black px-1 py-0.2 rounded-full uppercase tracking-tighter border border-white font-mono shadow">
        TOP
      </div>
    </div>
  )
}

export function TopAssisterBadge({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <div
      className={`relative flex items-center justify-center bg-gradient-to-b from-blue-300 via-blue-500 to-blue-700 p-0.5 rounded-lg shadow-lg border border-blue-300/60 group cursor-pointer ${className}`}
      title="🎯 League Top Assister (Golden Playmaker Winner)"
    >
      <div className="w-full h-full bg-black rounded-[6px] flex items-center justify-center font-bold text-blue-300 text-xs">
        <span className="text-sm select-none">🎯</span>
      </div>
      <div className="absolute -top-1 -right-1 bg-blue-400 text-black text-[7px] font-black px-1 py-0.2 rounded-full uppercase tracking-tighter border border-white font-mono shadow">
        TOP
      </div>
    </div>
  )
}
