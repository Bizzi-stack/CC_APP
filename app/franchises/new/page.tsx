'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewFranchisePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [budget, setBudget] = useState('100000')
  const [passcode, setPasscode] = useState('1234')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image must be less than 10MB')
        return
      }
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let logoUrl = null

      if (photoFile) {
        const formData = new FormData()
        formData.append('file', photoFile)

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        const uploadData = await uploadRes.json()

        if (!uploadRes.ok) {
          throw new Error(uploadData.error || 'Failed to upload photo')
        }

        logoUrl = uploadData.url
      }

      const res = await fetch('/api/franchises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          logo_url: logoUrl,
          budget: budget ? Number(budget) : 100000,
          passcode: passcode || '1234'
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create franchise')
      }

      router.push('/franchises')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a] sticky top-0 bg-black/90 backdrop-blur-md z-10">
        <Link href="/franchises" className="text-[#888] active:text-white transition-colors p-2 -ml-2">
          ← Cancel
        </Link>
        <h1 className="font-bold tracking-widest uppercase text-sm">New Team</h1>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      <div className="p-4 max-w-md mx-auto mt-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Badge Upload */}
          <div className="flex flex-col items-center gap-4">
            <div 
              className="w-32 h-32 rounded-full border-2 border-dashed border-[#333] flex flex-col items-center justify-center bg-[#0a0a0a] overflow-hidden relative"
              onClick={() => fileInputRef.current?.click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <svg className="w-8 h-8 mx-auto mb-2 text-[#555]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-[#555] uppercase tracking-widest">Upload Badge</span>
                </div>
              )}
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handlePhotoSelect}
            />
            
            {photoPreview && (
              <button 
                type="button" 
                onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                className="text-[#555] text-xs hover:text-white transition-colors"
              >
                Remove badge
              </button>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold tracking-widest uppercase text-[#555]">
              Team Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-black border border-[#333] p-4 text-white focus:outline-none focus:border-white transition-colors text-base"
              placeholder="e.g. Jaden FC"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold tracking-widest uppercase text-[#555]">
              Initial Budget/Credits (CR)
            </label>
            <input
              type="number"
              required
              value={budget}
              onChange={e => setBudget(e.target.value)}
              className="w-full bg-black border border-[#333] p-4 text-white focus:outline-none focus:border-white transition-colors text-base"
              placeholder="e.g. 100000"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold tracking-widest uppercase text-[#555]">
              Franchise Portal Passcode
            </label>
            <input
              type="text"
              required
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
              className="w-full bg-black border border-[#333] p-4 text-white focus:outline-none focus:border-white transition-colors text-base"
              placeholder="e.g. 1234"
            />
          </div>

          {error && (
            <div className="border border-[#ff4444] bg-[#ff4444]/10 text-[#ff4444] p-4 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold tracking-widest uppercase p-4 mt-8 active:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Team'}
          </button>
        </form>
      </div>
    </div>
  )
}
