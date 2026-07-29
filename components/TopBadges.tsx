'use client'

import React from 'react'

export function TopScorerBadge({ className = 'w-7 h-7' }: { className?: string }) {
  const handleClick = () => {
    alert('🏆 Top Scorer: This player leads the league in goals (Golden Boot).')
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative flex items-center justify-center bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 p-0.5 rounded-lg shadow-lg border border-amber-300/60 cursor-pointer ${className}`}
      title="League Top Scorer"
    >
      <div className="w-full h-full bg-black rounded-[6px] flex items-center justify-center font-bold text-amber-300 text-xs">
        <span className="text-sm select-none">⚽</span>
      </div>
    </button>
  )
}

export function TopAssisterBadge({ className = 'w-7 h-7' }: { className?: string }) {
  const handleClick = () => {
    alert('🎯 Top Assister: This player leads the league in assists (Golden Playmaker).')
  }
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative flex items-center justify-center bg-gradient-to-b from-blue-300 via-blue-500 to-blue-700 p-0.5 rounded-lg shadow-lg border border-blue-300/60 cursor-pointer ${className}`}
      title="League Top Assister"
    >
      <div className="w-full h-full bg-black rounded-[6px] flex items-center justify-center font-bold text-blue-300 text-xs">
        <span className="text-sm select-none">🎯</span>
      </div>
    </button>
  )
}
