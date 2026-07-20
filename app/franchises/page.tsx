'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'

interface Franchise {
  id: string
  name: string
  logo_url: string | null
  budget?: number
  passcode?: string
}

export default function FranchisesPage() {
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchFranchises()
  }, [])

  const fetchFranchises = async () => {
    try {
      const res = await fetch('/api/franchises')
      if (!res.ok) throw new Error('Failed to fetch franchises')
      const data = await res.json()
      setFranchises(data.franchises || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this franchise? Players in this franchise will become Free Agents.')) return

    try {
      const res = await fetch(`/api/franchises?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete franchise')
      setFranchises(franchises.filter(f => f.id !== id))
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
        <h1 className="font-bold tracking-widest uppercase text-sm">Teams</h1>
        <Link href="/franchises/new" className="text-white text-sm bg-[#222] px-3 py-1.5 active:bg-[#333] transition-colors">
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
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-[#111] animate-pulse border border-[#222]" />
            ))}
          </div>
        ) : franchises.length === 0 ? (
          <div className="border border-[#1a1a1a] p-8 text-center text-[#666]">
            No franchises yet.
          </div>
        ) : (
          <div className="space-y-3">
            {franchises.map(franchise => (
              <div key={franchise.id} className="border border-[#222] bg-[#0a0a0a] p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border border-[#333] bg-[#111] flex items-center justify-center overflow-hidden shrink-0">
                    {franchise.logo_url ? (
                      <img src={franchise.logo_url} alt={franchise.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[#444] text-xs font-bold uppercase">{franchise.name.substring(0, 2)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-base">{franchise.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[#aaa] text-xs font-bold">{franchise.budget?.toLocaleString() ?? 0} CR</span>
                      <span className="text-[#333]">·</span>
                      <span className="text-[#666] text-xs font-mono">Pin: {franchise.passcode || '1234'}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDelete(franchise.id)}
                  className="p-2 text-[#555] active:text-[#ff4444] transition-colors"
                  aria-label="Delete franchise"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
