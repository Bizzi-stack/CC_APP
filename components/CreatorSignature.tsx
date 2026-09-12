'use client'

import React from 'react'

export const CREATOR_INSTAGRAM_URL =
  'https://www.instagram.com/userfrombds?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw=='

export default function CreatorSignature() {
  return (
    <div className="flex items-center justify-center gap-2 mb-2.5 select-none">
      <span className="text-[11px] sm:text-xs text-[#888] font-mono tracking-tight lowercase">
        need a web app
      </span>
      <span className="text-amber-400 font-bold text-xs select-none">
        →
      </span>
      <a
        href={CREATOR_INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
        title="Visit Instagram"
      >
        <img
          src="/signature.png"
          alt="Signature"
          className="h-6 sm:h-7 w-auto max-w-[130px] object-contain brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity drop-shadow-sm"
          onError={(e) => {
            const target = e.currentTarget
            target.style.display = 'none'
            const fb = target.parentElement?.querySelector('.sig-fallback') as HTMLElement | null
            if (fb) fb.style.display = 'inline-flex'
          }}
        />
        <span
          className="sig-fallback text-xs font-serif italic text-white/80 border-b border-amber-400/50 hover:text-amber-400 transition-colors"
          style={{ display: 'none' }}
        >
          [signature] ↗
        </span>
      </a>
    </div>
  )
}
