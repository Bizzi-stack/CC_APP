'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Login failed')
      }

      // Successful login, go to admin dashboard
      window.location.href = '/home'
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative">
      <Link href="/" className="absolute top-6 left-6 text-[#888] text-sm hover:text-white transition-colors">
        ← Back to Market
      </Link>
      
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="The Circle FC" className="h-20 mx-auto object-contain brightness-0 invert mb-4" />
          <h1 className="text-sm font-bold tracking-[0.2em] uppercase text-white">Admin Access</h1>
          <p className="text-[#555] text-xs mt-2 uppercase tracking-widest">Authorized Personnel Only</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="w-full bg-[#0a0a0a] border border-[#333] p-4 text-center text-white focus:outline-none focus:border-white transition-colors text-base"
              autoFocus
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
            {loading ? 'Authenticating...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}
