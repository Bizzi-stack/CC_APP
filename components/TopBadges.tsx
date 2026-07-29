'use client'

import React from 'react'

export function TopScorerBadge({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center select-none shrink-0 ${className}`}
      title="League Top Scorer"
    >
      <span className="text-sm">👟</span>
    </span>
  )
}

export function TopAssisterBadge({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center select-none shrink-0 ${className}`}
      title="League Top Assister"
    >
      <span className="text-sm">🅰️</span>
    </span>
  )
}
