import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { getCroppedImg } from '@/lib/cropImage'

interface ImageCropperProps {
  imageSrc: string
  onCropDone: (croppedBlob: Blob) => void
  onCancel: () => void
  aspectRatio?: number
}

export default function ImageCropper({ imageSrc, onCropDone, onCancel, aspectRatio = 1 }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleCropSave = async () => {
    if (!croppedAreaPixels) return
    try {
      setIsProcessing(true)
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      if (croppedBlob) {
        onCropDone(croppedBlob)
      }
    } catch (e) {
      console.error('Error cropping image:', e)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#111] border border-[#222] rounded-xl w-full max-w-lg flex flex-col overflow-hidden">
        
        <div className="p-4 border-b border-[#222] flex justify-between items-center">
          <h3 className="text-white font-bold tracking-wider">CROP IMAGE</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white">✕</button>
        </div>

        <div className="relative w-full h-[400px] bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            cropShape="rect"
            showGrid={true}
          />
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center space-x-4">
            <span className="text-xs text-gray-500 font-bold">ZOOM</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-white"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 bg-[#222] text-white text-sm font-bold tracking-wider rounded disabled:opacity-50"
            >
              CANCEL
            </button>
            <button
              onClick={handleCropSave}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 bg-white text-black text-sm font-bold tracking-wider rounded disabled:opacity-50"
            >
              {isProcessing ? 'PROCESSING...' : 'CROP & SAVE'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
