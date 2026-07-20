'use client'

import { useState, useRef } from 'react'
import FilterBar from '@/components/FilterBar'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setUploadedUrl(null)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setUploadedUrl(data.url)
      setFile(null)
      setPreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const copyToClipboard = () => {
    if (uploadedUrl) {
      navigator.clipboard.writeText(uploadedUrl)
      alert('URL copied to clipboard!')
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <FilterBar category="" priceRange="" sort="best-match" search="" />
      
      <div className="max-w-[1440px] mx-auto px-6 py-6">
        <h1 className="text-2xl font-semibold text-[#FFFFFF] mb-6">Upload Image</h1>

        <div className="bg-[#1B1B1B] rounded-[6px] p-6 border border-[#2A2A2A] max-w-2xl">
          {/* File Input */}
          <div className="mb-6">
            <label className="block text-[13px] font-medium text-[#FFFFFF] mb-2">
              Select Image
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="block w-full text-[13px] text-[#FFFFFF] file:mr-4 file:py-2 file:px-4 file:rounded-[4px] file:border-0 file:text-[13px] file:font-medium file:bg-[#2A2A2A] file:text-[#FFFFFF] hover:file:bg-[#3A3A3A] file:cursor-pointer"
            />
            <p className="mt-2 text-[11px] text-[#9A9A9A]">
              Supported formats: JPEG, PNG, WebP, GIF (Max 10MB)
            </p>
          </div>

          {/* Preview */}
          {preview && (
            <div className="mb-6">
              <label className="block text-[13px] font-medium text-[#FFFFFF] mb-2">
                Preview
              </label>
              <div className="relative w-full max-w-md aspect-square rounded-[4px] overflow-hidden bg-[#2A2A2A]">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full h-10 rounded-[4px] bg-[#FFD100] text-[#000000] text-[13px] font-medium hover:bg-[#E6BE00] transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {uploading ? 'Uploading...' : 'Upload Image'}
          </button>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-[4px] bg-red-900/20 border border-red-500/50">
              <p className="text-[13px] text-red-400">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {uploadedUrl && (
            <div className="p-4 rounded-[4px] bg-green-900/20 border border-green-500/50">
              <p className="text-[13px] font-medium text-green-400 mb-2">
                ✓ Image uploaded successfully!
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={uploadedUrl}
                  readOnly
                  className="flex-1 px-3 py-2 rounded-[4px] bg-[#2A2A2A] border border-[#3A3A3A] text-[#FFFFFF] text-[12px]"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 rounded-[4px] bg-[#2A2A2A] text-[#FFFFFF] text-[12px] font-medium hover:bg-[#3A3A3A] transition"
                >
                  Copy
                </button>
              </div>
              <p className="mt-2 text-[11px] text-[#9A9A9A]">
                Use this URL in your catalog items
              </p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-[#1B1B1B] rounded-[6px] p-6 border border-[#2A2A2A] max-w-2xl">
          <h2 className="text-[14px] font-semibold text-[#FFFFFF] mb-3">Setup Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-[13px] text-[#9A9A9A]">
            <li>Make sure your Supabase project is set up with the <code className="text-[#FFD100]">catalog-images</code> storage bucket</li>
            <li>Set the bucket to public (or configure Row Level Security)</li>
            <li>Add your Supabase credentials to <code className="text-[#FFD100]">.env.local</code></li>
            <li>Upload your images and copy the URL for use in your catalog</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
