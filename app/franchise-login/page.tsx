'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Franchise {
  id: string
  name: string
  logo_url: string | null
}

export default function FranchiseLoginPage() {
  const router = useRouter()
  const [franchises, setFranchises] = useState<Franchise[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [passcode, setPasscode] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/franchises')
      .then(res => res.json())
      .then(data => {
        setFranchises(data.franchises || [])
        if (data.franchises?.length > 0) {
          setSelectedId(data.franchises[0].id)
        }
        setFetching(false)
      })
      .catch(() => setFetching(false))
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId) {
      setError('Please select a franchise')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/franchise/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ franchiseId: selectedId, passcode })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Login failed')
      }

      window.location.href = '/franchise-portal'
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative">
      <Link href="/home" className="absolute top-6 left-6 text-[#888] text-sm hover:text-white transition-colors">
        ← Back Home
      </Link>
      
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="The Circle FC" className="h-20 mx-auto object-contain brightness-0 invert mb-4" />
          <h1 className="text-sm font-bold tracking-[0.2em] uppercase text-white">Franchise Portal</h1>
          <p className="text-[#555] text-xs mt-2 uppercase tracking-widest">Sign in to manage your budget and roster</p>
        </div>

        {fetching ? (
          <div className="text-center text-[#555] text-sm tracking-wider uppercase animate-pulse">
            Loading Teams...
          </div>
        ) : franchises.length === 0 ? (
          <div className="border border-[#333] bg-[#0a0a0a] p-6 text-center">
            <p className="text-[#555] text-sm uppercase tracking-wider mb-4">No franchises registered yet.</p>
            <Link href="/home" className="text-white text-xs font-bold uppercase tracking-wider bg-[#222] px-4 py-2 hover:bg-[#333] transition-colors">
              Go Back
            </Link>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-[#555]">
                Select Franchise
              </label>
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#333] p-4 text-white focus:outline-none focus:border-white transition-colors text-base appearance-none rounded-none"
              >
                {franchises.map(f => (
                  <option key={f.id} value={f.id} className="bg-black">
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-[#555]">
                Enter Passcode
              </label>
              <input
                type="password"
                required
                value={passcode}
                onChange={e => setPasscode(e.target.value)}
                placeholder="••••"
                className="w-full bg-[#0a0a0a] border border-[#333] p-4 text-center text-white focus:outline-none focus:border-white transition-colors text-base tracking-[0.3em] font-bold"
              />
            </div>

            {error && (
              <div className="border border-[#ff4444] bg-[#ff4444]/10 text-[#ff4444] p-3 text-center text-xs tracking-widest uppercase font-bold">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-bold tracking-widest uppercase p-4 active:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Access Portal'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
