'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import PublicNav from '@/components/PublicNav'

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF']

type Step = 'form' | 'uploading' | 'done'

export default function JoinPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('form')
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: '',
    position: '',
    notes: '',
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) {
      setError('Photo must be under 5MB')
      return
    }
    setFile(f)
    setError(null)
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { setError('A headshot photo is required'); return }
    if (!form.name.trim()) { setError('Name is required'); return }

    setStep('uploading')
    setError(null)

    try {
      // 1. Upload headshot
      const uploadForm = new FormData()
      uploadForm.append('file', file)
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadForm })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Photo upload failed')

      // 2. Submit to join queue
      const joinRes = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          position: form.position || null,
          photo_url: uploadData.url,
          notes: form.notes.trim() || null,
        }),
      })
      const joinData = await joinRes.json()
      if (!joinRes.ok) throw new Error(joinData.error || 'Submission failed')

      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStep('form')
    }
  }

  const inputClass = "w-full h-11 px-3 bg-transparent border border-[#333] text-white text-sm outline-none focus:border-white transition-colors placeholder-[#555]"
  const labelClass = "block text-[10px] font-bold text-[#555] tracking-widest uppercase mb-1.5"

  // ── Success screen ──
  if (step === 'done') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-6">✓</div>
        <h1 className="text-xl font-bold tracking-wide uppercase mb-2">Submission Received</h1>
        <p className="text-[#555] text-sm leading-relaxed">
          Your profile has been submitted for review.<br />
          The admin will verify and approve your entry.
        </p>
        <button
          onClick={() => router.push('/market')}
          className="mt-8 text-xs text-[#555] underline tracking-widest uppercase"
        >
          View Transfer Market
        </button>
      </div>
    )
  }

  // ── Uploading screen ──
  if (step === 'uploading') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <p className="text-[#555] text-sm tracking-widest uppercase">Submitting...</p>
      </div>
    )
  }

  // ── Form ──
  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="flex flex-col items-center pt-12 pb-6 border-b border-[#1a1a1a] px-4">
        <img src="/logo_2.png" alt="The Circle FC" className="h-14 object-contain brightness-0 invert mb-4" />
        <h1 className="text-xl font-bold tracking-[0.2em] uppercase text-center">Join</h1>
        <p className="text-[#555] text-xs tracking-widest uppercase mt-2 text-center max-w-[280px]">
          Submit your profile to enter the transfer market
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-6 pb-24 space-y-6">

        {/* Headshot Upload */}
        <div className="flex flex-col items-center gap-3">
          <label className={labelClass + ' self-start w-full'}>Headshot Photo *</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="headshot"
          />
          <label
            htmlFor="headshot"
            className="cursor-pointer w-full"
          >
            {preview ? (
              <div className="relative w-full aspect-square max-h-64 overflow-hidden border border-[#333]">
                <img src={preview} alt="Your headshot" className="w-full h-full object-cover object-top" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-bold tracking-widest uppercase">Change Photo</span>
                </div>
              </div>
            ) : (
              <div className="w-full aspect-square max-h-64 border-2 border-dashed border-[#333] flex flex-col items-center justify-center gap-3 hover:border-white transition-colors">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5">
                  <path d="M20 7h-3.4L15 5H9L7.4 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                  <circle cx="12" cy="13" r="3"/>
                </svg>
                <div className="text-center">
                  <p className="text-white text-sm font-semibold">Tap to add headshot</p>
                  <p className="text-[#555] text-xs mt-0.5">Face forward, clear background</p>
                </div>
              </div>
            )}
          </label>
          {preview && (
            <button
              type="button"
              onClick={() => { setPreview(null); setFile(null) }}
              className="text-[#555] text-xs hover:text-white transition-colors"
            >
              Remove photo
            </button>
          )}
        </div>

        {/* Name */}
        <div>
          <label className={labelClass}>Full Name *</label>
          <input
            name="name"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            required
            className={inputClass}
            placeholder="e.g. Marcus Reid"
          />
        </div>

        {/* Position */}
        <div>
          <label className={labelClass}>Position</label>
          <div className="flex flex-wrap gap-2">
            {POSITIONS.map(pos => (
              <button
                key={pos}
                type="button"
                onClick={() => setForm(p => ({ ...p, position: p.position === pos ? '' : pos }))}
                className={`text-xs font-bold px-3 py-2 border transition-colors ${
                  form.position === pos
                    ? 'bg-white text-black border-white'
                    : 'border-[#333] text-[#888] hover:border-white'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        {/* Notes / About */}
        <div>
          <label className={labelClass}>About (optional)</label>
          <input
            name="notes"
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            className={inputClass}
            placeholder="Anything you want the admin to know"
          />
        </div>

        {error && (
          <div className="border border-red-900 bg-red-900/10 text-red-400 text-xs px-3 py-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full h-12 bg-white text-black text-sm font-bold tracking-widest uppercase active:bg-gray-200 transition-colors"
        >
          Submit for Review
        </button>

        <p className="text-[#444] text-xs text-center leading-relaxed">
          Your submission will be reviewed by an admin before appearing on the transfer market.
        </p>
      </form>
      <PublicNav />
    </div>
  )
}
