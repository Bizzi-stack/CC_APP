'use client'

import { useRef, useState, useEffect } from 'react'

interface CanvasBadge {
  id: string
  name: string
  image_url: string
}

export interface BadgePosition {
  id: string
  x: number // percentage 0-100
  y: number // percentage 0-100
  width?: number // percentage of canvas width
  height?: number // percentage of canvas height
}

export default function BadgeCanvasEditor({
  availableBadges,
  positions,
  onChange
}: {
  availableBadges: CanvasBadge[]
  positions: BadgePosition[]
  onChange: (positions: BadgePosition[]) => void
}) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [resizingId, setResizingId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Handle pointer down to start drag or resize
  const onPointerDown = (e: React.PointerEvent, id: string, isResize: boolean = false) => {
    e.preventDefault()
    e.stopPropagation()
    if (isResize) {
      setResizingId(id)
    } else {
      setDraggingId(id)
      const badgeRect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      setDragOffset({
        x: e.clientX - badgeRect.left,
        y: e.clientY - badgeRect.top
      })
    }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  // Handle pointer move to update drag or resize
  const onPointerMove = (e: React.PointerEvent) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()

    if (draggingId) {
      const pos = positions.find(p => p.id === draggingId)
      if (!pos) return

      let rawX = ((e.clientX - dragOffset.x - rect.left) / rect.width) * 100
      let rawY = ((e.clientY - dragOffset.y - rect.top) / rect.height) * 100
      
      // Snap to nearest 5% for x (20 columns)
      let snappedX = Math.round(rawX / 5) * 5
      // Snap to nearest 20% for y (5 rows)
      let snappedY = Math.round(rawY / 20) * 20

      const width = pos.width || 10
      const height = pos.height || 40
      snappedX = Math.max(0, Math.min(100 - width, snappedX))
      snappedY = Math.max(0, Math.min(100 - height, snappedY))
      
      onChange(positions.map(p => p.id === draggingId ? { ...p, x: snappedX, y: snappedY } : p))
    } else if (resizingId) {
      const pos = positions.find(p => p.id === resizingId)
      if (!pos) return
      
      const badgeLeftX = rect.left + (pos.x / 100) * rect.width
      const dx = e.clientX - badgeLeftX
      let rawWidth = (dx / rect.width) * 100
      let snappedWidth = Math.round(rawWidth / 5) * 5
      snappedWidth = Math.max(5, Math.min(100 - pos.x, snappedWidth))
      
      const badgeTopY = rect.top + (pos.y / 100) * rect.height
      const dy = e.clientY - badgeTopY
      let rawHeight = (dy / rect.height) * 100
      let snappedHeight = Math.round(rawHeight / 20) * 20
      snappedHeight = Math.max(20, Math.min(100 - pos.y, snappedHeight))
      
      onChange(positions.map(p => p.id === resizingId ? { ...p, width: snappedWidth, height: snappedHeight } : p))
    }
  }

  // Handle pointer up to stop drag or resize
  const onPointerUp = (e: React.PointerEvent) => {
    if (draggingId || resizingId) {
      setDraggingId(null)
      setResizingId(null)
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {availableBadges.map(badge => {
          const isSelected = positions.some(p => p.id === badge.id)
          return (
            <div
              key={badge.id}
              onClick={() => {
                if (isSelected) {
                  onChange(positions.filter(p => p.id !== badge.id))
                } else {
                  onChange([...positions, { id: badge.id, x: 0, y: 0, width: 10, height: 40 }])
                }
              }}
              className={`w-full aspect-square border ${isSelected ? 'border-white bg-[#222]' : 'border-[#333] bg-[#111]'} flex items-center justify-center p-2 cursor-pointer transition-colors relative`}
              title={badge.name}
            >
              <img src={badge.image_url} alt={badge.name} className="w-full h-full object-contain" />
              {isSelected && (
                <div className="absolute -top-1 -right-1 bg-white text-black rounded-full w-4 h-4 flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {positions.length > 0 && (
        <div>
          <label className="block text-[10px] font-bold text-[#555] tracking-widest uppercase mb-1.5">
            Position Badges (Drag)
          </label>
          <div 
            ref={canvasRef}
            className="w-full h-48 border border-[#333] bg-[#0d0d0d] rounded-lg overflow-hidden relative"
            style={{ 
              backgroundImage: 'linear-gradient(to right, #222 1px, transparent 1px), linear-gradient(to bottom, #222 1px, transparent 1px)', 
              backgroundSize: '5% 20%', 
              backgroundPosition: 'left top' 
            }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <div className="absolute inset-0 opacity-[0.03] bg-black" />
            
            {positions.map(pos => {
              const badge = availableBadges.find(b => b.id === pos.id)
              if (!badge) return null
              const width = pos.width || 10
              const height = pos.height || 40
              const isActive = draggingId === pos.id || resizingId === pos.id
              return (
                <div
                  key={pos.id}
                  className={`absolute flex items-center justify-center touch-none ${isActive ? 'ring-2 ring-white/50 bg-white/5' : ''}`}
                  style={{ 
                    left: `${pos.x}%`, 
                    top: `${pos.y}%`,
                    width: `${width}%`,
                    height: `${height}%`,
                    zIndex: isActive ? 10 : 1 
                  }}
                >
                  <img 
                    src={badge.image_url} 
                    alt={badge.name} 
                    className="w-full h-full object-cover filter drop-shadow-md cursor-move pointer-events-auto"
                    onPointerDown={(e) => onPointerDown(e, pos.id, false)}
                    draggable={false}
                  />
                  {/* Resize Handle */}
                  <div 
                    className="absolute bottom-0 right-0 w-6 h-6 bg-white border border-[#333] rounded-full cursor-se-resize flex items-center justify-center translate-x-1/2 translate-y-1/2 shadow-lg pointer-events-auto z-20"
                    onPointerDown={(e) => onPointerDown(e, pos.id, true)}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
