'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BadgeCanvasEditor, { BadgePosition } from '@/components/BadgeCanvasEditor'

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF']

export default function NewPlayerPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [franchises, setFranchises] = useState<{id: string, name: string}[]>([])
  const [canvasBadges, setCanvasBadges] = useState<{id: string, name: string, image_url: string}[]>([])
  const [canvasBadgesData, setCanvasBadgesData] = useState<BadgePosition[]>([])

  // Fetch franchises and badges on load
  useEffect(() => {
    Promise.all([
      fetch('/api/franchises').then(res => res.json()),
      fetch('/api/canvas-badges').then(res => res.json())
    ]).then(([franchisesData, badgesData]) => {
      setFranchises(franchisesData.franchises || [])
      setCanvasBadges(badgesData.badges || [])
    }).catch(console.error)
  }, [])

  const [form, setForm] = useState({
    name: '',
    position: '',
    available: true,
    notes: '',
    value: '',
    franchise_id: '',
    badges: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      let photo_url: string | null = null

      // Upload photo if provided
      if (file) {
        setUploadingPhoto(true)
        const uploadForm = new FormData()
        uploadForm.append('file', file)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadForm })
        const uploadData = await uploadRes.json()
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Photo upload failed')
        photo_url = uploadData.url
        setUploadingPhoto(false)
      }

      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          photo_url,
          value: form.value ? parseInt(form.value as string) : 0,
          franchise_id: form.franchise_id || null,
          badges: form.badges.split(',').map(b => b.trim()).filter(b => b),
          canvas_badge_ids: canvasBadgesData.map(b => b.id),
          canvas_badges_data: canvasBadgesData,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add player')

      router.push('/players')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
      setUploadingPhoto(false)
    }
  }

  const inputClass = "w-full h-11 px-3 bg-transparent border border-[#333] text-white text-sm outline-none focus:border-white transition-colors placeholder-[#555]"
  const labelClass = "block text-[10px] font-bold text-[#555] tracking-widest uppercase mb-1.5"

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b border-[#1a1a1a]">
        <Link href="/players" className="text-[#666] active:text-white transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <h1 className="text-lg font-bold tracking-wide uppercase">Add Player</h1>
      </div>

      <form onSubmit={handleSubmit} className="page-content px-4 pt-6 space-y-5">
        {/* Photo Upload */}
        <div className="flex flex-col items-center">
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="player-photo" />
          <label htmlFor="player-photo" className="cursor-pointer">
            <div className={`w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-colors ${preview ? 'border-transparent' : 'border-[#333] hover:border-white'}`}>
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" className="mx-auto mb-1">
                    <path d="M20 7h-3.4L15 5H9L7.4 7H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><circle cx="12" cy="13" r="3"/>
                  </svg>
                  <span className="text-[9px] text-[#555] uppercase tracking-wide">Photo</span>
                </div>
              )}
            </div>
          </label>
          {preview && (
            <button type="button" onClick={() => { setPreview(null); setFile(null) }} className="text-[#555] text-xs mt-2 hover:text-white transition-colors">Remove</button>
          )}
        </div>

        {/* Name */}
        <div>
          <label className={labelClass}>Full Name</label>
          <input name="name" value={form.name} onChange={handleChange} required className={inputClass} placeholder="e.g. Marcus Reid" />
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
                className={`text-xs font-bold px-3 py-1.5 border transition-colors ${form.position === pos ? 'bg-white text-black border-white' : 'border-[#333] text-[#888] hover:border-[#555]'}`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        {/* Availability Toggle */}
        <div>
          <label className={labelClass}>Availability</label>
          <div className="flex border border-[#333]">
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, available: true }))}
              className={`flex-1 py-3 text-xs font-bold tracking-widest uppercase transition-colors ${form.available ? 'bg-[#0f2e0f] text-[#4caf50] border-r border-[#2a6b2a]' : 'text-[#555]'}`}
            >
              Available
            </button>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, available: false }))}
              className={`flex-1 py-3 text-xs font-bold tracking-widest uppercase transition-colors ${!form.available ? 'bg-[#111] text-[#888]' : 'text-[#555]'}`}
            >
              Signed
            </button>
          </div>
        </div>

        {/* Market Value */}
        <div>
          <label className={labelClass}>Market Value (CR)</label>
          <div className="relative">
            <input
              name="value"
              type="number"
              min="0"
              value={form.value}
              onChange={handleChange}
              className={`${inputClass} pr-12`}
              placeholder="e.g. 5000"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] text-xs font-bold">CR</span>
          </div>
        </div>

        {/* Assign Franchise */}
        <div>
          <label className={labelClass}>Assign Franchise</label>
          <select
            name="franchise_id"
            value={form.franchise_id}
            onChange={handleChange}
            className={`${inputClass} appearance-none`}
          >
            <option value="" className="bg-[#111]">Free Agent (None)</option>
            {franchises.map(f => (
              <option key={f.id} value={f.id} className="bg-[#111]">
                {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className={labelClass}>Notes (optional)</label>
          <input name="notes" value={form.notes} onChange={handleChange} className={inputClass} placeholder="e.g. Injured, On holiday..." />
        </div>

        {/* Text Badges */}
        <div>
          <label className={labelClass}>Text Badges (optional)</label>
          <input name="badges" value={form.badges} onChange={handleChange} className={inputClass} placeholder="e.g. Top Scorer, MVP, 10 Assists" />
          <p className="text-[10px] text-[#555] mt-1">Separate multiple badges with commas.</p>
        </div>

        {/* Canvas Badges */}
        {canvasBadges.length > 0 && (
          <BadgeCanvasEditor
            availableBadges={canvasBadges}
            positions={canvasBadgesData}
            onChange={setCanvasBadgesData}
          />
        )}

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
          {uploadingPhoto ? 'Uploading photo...' : submitting ? 'Saving...' : 'Add Player'}
        </button>
      </form>
    </div>
  )
}
