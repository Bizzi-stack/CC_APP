'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewSessionPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    type: 'free_session' as 'free_session' | '5v5_match',
    date: '',
    time: '',
    location: '',
    notes: '',
    max_players: '10',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          max_players: parseInt(form.max_players) || 10,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create session')

      router.push('/sessions')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  const inputClass = "w-full h-11 px-3 bg-transparent border border-[#333] text-white text-sm outline-none focus:border-white transition-colors placeholder-[#555]"
  const labelClass = "block text-[10px] font-bold text-[#555] tracking-widest uppercase mb-1.5"

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-[#1a1a1a]">
        <Link href="/sessions" className="text-[#666] active:text-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <h1 className="text-lg font-bold tracking-wide uppercase">New Session</h1>
      </div>

      <form onSubmit={handleSubmit} className="page-content px-4 pt-6 space-y-5">
        {/* Type Toggle */}
        <div>
          <label className={labelClass}>Type</label>
          <div className="flex border border-[#333]">
            {(['free_session', '5v5_match'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setForm(p => ({ ...p, type: t }))}
                className={`flex-1 py-3 text-xs font-bold tracking-widest uppercase transition-colors ${form.type === t ? 'bg-white text-black' : 'text-[#555] hover:text-white'}`}
              >
                {t === 'free_session' ? 'Free Session' : '5v5 Match'}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className={labelClass}>Title</label>
          <input name="title" value={form.title} onChange={handleChange} required className={inputClass} placeholder="e.g. Friday Night 5v5" />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Date</label>
            <input name="date" type="date" value={form.date} onChange={handleChange} required className={inputClass} style={{ colorScheme: 'dark' }} />
          </div>
          <div>
            <label className={labelClass}>Time</label>
            <input name="time" type="time" value={form.time} onChange={handleChange} required className={inputClass} style={{ colorScheme: 'dark' }} />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className={labelClass}>Location</label>
          <input name="location" value={form.location} onChange={handleChange} required className={inputClass} placeholder="e.g. Wildey Gymnasium" />
        </div>

        {/* Max Players */}
        <div>
          <label className={labelClass}>Max Players</label>
          <input name="max_players" type="number" min="2" max="50" value={form.max_players} onChange={handleChange} className={inputClass} />
        </div>

        {/* Notes */}
        <div>
          <label className={labelClass}>Notes (optional)</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2.5 bg-transparent border border-[#333] text-white text-sm outline-none focus:border-white transition-colors placeholder-[#555] resize-none"
            placeholder="Any extra info..."
          />
        </div>

        {error && (
          <div className="border border-red-900 bg-red-900/10 text-red-400 text-xs px-3 py-2.5">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-12 bg-white text-black text-sm font-bold tracking-widest uppercase transition-opacity disabled:opacity-40 active:bg-gray-200"
        >
          {submitting ? 'Saving...' : 'Add Session'}
        </button>
      </form>
    </div>
  )
}
