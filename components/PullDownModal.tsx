'use client'

import React, { useEffect, useState, useRef } from 'react'

interface PullDownModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function PullDownModal({ isOpen, onClose, children }: PullDownModalProps) {
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const startYRef = useRef(0)
  const currentYRef = useRef(0)
  const sheetRef = useRef<HTMLDivElement>(null)

  // Handle browser back button (popstate)
  useEffect(() => {
    if (!isOpen) return

    const handlePopState = () => {
      onClose()
    }

    // Push state so hitting back button closes the modal instead of leaving the page
    window.history.pushState({ pullDownModal: true }, '')
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsClosing(false)
      setDragY(0)
      onClose()
    }, 200)
  }

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY
    currentYRef.current = e.touches[0].clientY
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const currentY = e.touches[0].clientY
    const deltaY = currentY - startYRef.current
    currentYRef.current = currentY

    if (deltaY > 0) {
      // Pulling down
      setDragY(deltaY)
    } else {
      // Pulling up - add resistance
      setDragY(deltaY * 0.2)
    }
  }

  const handleTouchEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    const deltaY = currentYRef.current - startYRef.current

    if (deltaY > 70) {
      // Dismiss if pulled down past threshold
      handleClose()
    } else {
      // Snap back to top
      setDragY(0)
    }
  }

  // Mouse drag handlers for desktop support
  const handleMouseDown = (e: React.MouseEvent) => {
    startYRef.current = e.clientY
    currentYRef.current = e.clientY
    setIsDragging(true)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startYRef.current
      currentYRef.current = moveEvent.clientY
      if (deltaY > 0) {
        setDragY(deltaY)
      } else {
        setDragY(deltaY * 0.2)
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      const deltaY = currentYRef.current - startYRef.current

      if (deltaY > 70) {
        handleClose()
      } else {
        setDragY(0)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  // Calculate backdrop opacity
  const backdropOpacity = Math.max(0.2, 1 - dragY / 300)

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end transition-opacity duration-200"
      style={{
        backgroundColor: `rgba(0, 0, 0, ${0.85 * backdropOpacity})`,
        backdropFilter: 'blur(8px)'
      }}
      onClick={handleClose}
    >
      <div
        ref={sheetRef}
        className={`w-full max-w-[440px] mx-auto bg-[#0a0a0c] border-t border-[#222] rounded-t-3xl p-6 pb-12 relative overflow-y-auto max-h-[90vh] shadow-2xl ${
          isDragging ? '' : 'transition-transform duration-200 ease-out'
        }`}
        style={{
          transform: isClosing
            ? 'translateY(100%)'
            : `translateY(${Math.max(0, dragY)}px)`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Wedge & Drag Handle Area */}
        <div
          className="w-full py-2 mb-4 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-none group"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onClick={handleClose}
          title="Drag down or click to close profile"
        >
          {/* Pull Wedge Icon / Indicator */}
          <div className="w-12 h-1.5 bg-[#444] group-hover:bg-amber-400 rounded-full transition-colors mb-1" />
          <div className="text-[10px] font-bold text-[#666] group-hover:text-amber-400 uppercase tracking-widest flex items-center gap-1 transition-colors select-none">
            <span>▼</span>
            <span>Pull Down to Close</span>
          </div>
        </div>

        {/* Modal Content */}
        {children}
      </div>
    </div>
  )
}
