'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

interface CanvasBadge {
  id: string
  name: string
  image_url: string
}

export default function BadgesPage() {
  const [badges, setBadges] = useState<CanvasBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBadges()
  }, [])

  const fetchBadges = async () => {
    try {
      const res = await fetch('/api/canvas-badges')
      if (!res.ok) throw new Error('Failed to fetch badges')
      const data = await res.json()
      setBadges(data.badges || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this badge from the library?')) return

    try {
      const res = await fetch(`/api/canvas-badges?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete badge')
      setBadges(badges.filter(b => b.id !== id))
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a] sticky top-0 bg-black/90 backdrop-blur-md z-10">
        <Link href="/home" className="text-[#888] active:text-white transition-colors p-2 -ml-2">
          ← Back
        </Link>
        <h1 className="font-bold tracking-widest uppercase text-sm">Badge Library</h1>
        <Link href="/badges/new" className="text-white text-sm bg-[#222] px-3 py-1.5 active:bg-[#333] transition-colors">
          + Add
        </Link>
      </div>

      <div className="p-4 space-y-4">
        {error && (
          <div className="bg-[#ff4444]/10 border border-[#ff4444] text-[#ff4444] p-3 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-[#111] animate-pulse border border-[#222]" />
            ))}
          </div>
        ) : badges.length === 0 ? (
          <div className="border border-[#1a1a1a] p-8 text-center text-[#666]">
            No badges in your library yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {badges.map(badge => (
              <div key={badge.id} className="border border-[#222] bg-[#0a0a0a] p-4 flex flex-col items-center gap-3 relative">
                <button
                  onClick={() => handleDelete(badge.id)}
                  className="absolute top-2 right-2 p-1.5 bg-[#111] border border-[#333] text-[#555] active:text-[#ff4444] transition-colors"
                  aria-label="Delete badge"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>

                <div className="w-20 h-20 flex items-center justify-center overflow-hidden">
                  <img src={badge.image_url} alt={badge.name} className="w-full h-full object-contain" />
                </div>
                <h3 className="font-bold text-xs text-center">{badge.name}</h3>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
