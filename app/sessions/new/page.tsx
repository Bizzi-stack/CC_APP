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
    max_players: '999',
    image_url: '',
    has_team_selection: true,
    team_a_name: 'Red Team',
    team_b_name: 'Blue Team',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setForm(prev => ({ ...prev, [name]: checked }))
    } else {
      setForm(prev => ({ ...prev, [name]: value }))
    }
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
          max_players: parseInt(form.max_players) || 999,
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
    <div className="min-h-screen bg-black text-white pb-12">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-[#1a1a1a]">
        <Link href="/sessions" className="text-[#666] active:text-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <h1 className="text-lg font-bold tracking-wide uppercase">Add New Event & Session</h1>
      </div>

      <form onSubmit={handleSubmit} className="page-content max-w-lg mx-auto px-4 pt-6 space-y-5 text-left">
        {/* Type Toggle */}
        <div>
          <label className={labelClass}>Session Type</label>
          <div className="flex border border-[#333]">
            {(['free_session', '5v5_match'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setForm(p => ({ ...p, type: t }))}
                className={`flex-1 py-3 text-xs font-bold tracking-widest uppercase transition-colors ${form.type === t ? 'bg-white text-black' : 'text-[#555] hover:text-white'}`}
              >
                {t === 'free_session' ? 'Pickup Session' : '5v5 Match'}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className={labelClass}>Event Title</label>
          <input name="title" value={form.title} onChange={handleChange} required className={inputClass} placeholder="e.g. Friday Night Ball ⚽" />
        </div>

        {/* Graphic / Poster Image URL */}
        <div>
          <label className={labelClass}>Event Graphic / Poster Image URL</label>
          <input name="image_url" value={form.image_url} onChange={handleChange} className={inputClass} placeholder="Paste graphic URL (e.g. https://... or /poster.png)" />
          {form.image_url && (
            <div className="mt-2 w-full h-44 rounded-xl border border-[#333] overflow-hidden bg-[#070707] flex items-center justify-center relative">
              <img src={form.image_url} alt="Poster preview" className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 text-[9px] font-mono text-emerald-400 border border-emerald-500/30 rounded">
                Graphic Preview
              </div>
            </div>
          )}
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
          <label className={labelClass}>Location / Pitch</label>
          <input name="location" value={form.location} onChange={handleChange} required className={inputClass} placeholder="e.g. Wildey Turf / Gymnasium" />
        </div>

        {/* Team Selection Customization */}
        <div className="bg-[#0a0a0c] border border-amber-500/30 p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>⚽</span> Enable Team Selection (Red vs Blue)
            </span>
            <input
              type="checkbox"
              name="has_team_selection"
              checked={form.has_team_selection}
              onChange={handleChange}
              className="w-4 h-4 accent-amber-500 cursor-pointer"
            />
          </div>

          {form.has_team_selection && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[9px] font-mono text-[#888] uppercase mb-1">Team A Name</label>
                <input name="team_a_name" value={form.team_a_name} onChange={handleChange} className={inputClass} placeholder="Red Team 🔴" />
              </div>
              <div>
                <label className="block text-[9px] font-mono text-[#888] uppercase mb-1">Team B Name</label>
                <input name="team_b_name" value={form.team_b_name} onChange={handleChange} className={inputClass} placeholder="Blue Team 🔵" />
              </div>
            </div>
          )}
        </div>

        {/* Max Players */}
        <div>
          <label className={labelClass}>Max Players Capacity</label>
          <input name="max_players" type="number" min="2" max="999" value={form.max_players} onChange={handleChange} className={inputClass} placeholder="999 for Unlimited" />
        </div>

        {/* Notes */}
        <div>
          <label className={labelClass}>Event Description / Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2.5 bg-transparent border border-[#333] text-white text-sm outline-none focus:border-white transition-colors placeholder-[#555] resize-none"
            placeholder="Details about Friday's match, gear needed, wages..."
          />
        </div>

        {error && (
          <div className="border border-red-900 bg-red-900/10 text-red-400 text-xs px-3 py-2.5 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-400 text-black text-sm font-black tracking-widest uppercase rounded-xl transition-all disabled:opacity-40 hover:brightness-110 active:scale-95 shadow-lg"
        >
          {submitting ? 'Creating Event...' : 'Publish Event & Graphic'}
        </button>
      </form>
    </div>
  )
}
