'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(false)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      if (!res.ok) {
        throw new Error('Invalid password')
      }

      // Successful login for either admin or community
      window.location.href = '/home'
    } catch (err) {
      setError(true)
      setShaking(true)
      setLoading(false)
      setTimeout(() => setShaking(false), 500)
    }
  }

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black flex flex-col items-center justify-center">

      {/* Background GIF Layer */}
      <div className="absolute inset-0 z-0 opacity-60">
        <img
          src="/background.gif.gif"
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 p-4">
        <div className="mb-16 mt-20">
          <img src="/logo.png" alt="ARTIC" className="h-20 md:h-28 object-contain scale-[2] md:scale-[3]" />
        </div>

        {/* Password Form */}
        <form onSubmit={handleLogin} className={`flex w-full max-w-[400px] h-12 transition-transform ${shaking ? 'translate-x-[-10px]' : ''} ${shaking ? 'animate-shake' : ''}`}>
          <div className="flex-1 bg-white flex items-center px-4">
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                setError(false)
              }}
              placeholder="Site Password"
              className="w-full bg-transparent border-none text-black placeholder-gray-500 outline-none font-mono text-sm tracking-widest"
              autoFocus
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-6 font-bold tracking-widest uppercase font-mono text-sm hover:bg-[#222] transition-colors flex items-center justify-center border-l border-black disabled:opacity-50"
          >
            {loading ? '...' : 'ENTER'}
          </button>
        </form>

        <div className={`h-6 text-[#FF4D4D] text-xs font-bold tracking-widest uppercase font-mono transition-opacity duration-300 ${error ? 'opacity-100' : 'opacity-0'}`}>
          Access Denied
        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </main>
  )
}
