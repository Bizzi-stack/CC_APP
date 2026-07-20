'use client'

import { useEffect, useRef, useState } from 'react'

// Define the playlist from the public folder
const PLAYLIST = [
  "/Reminiscing_spotdown.org.mp3",
  "/collage_spotdown.org.mp3",
  "/on me_spotdown.org.mp3"
]

export default function BackgroundAudio() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)

  // Attempt to play automatically on the user's first click anywhere on the page
  useEffect(() => {
    const handleInteraction = () => {
      if (!hasInteracted && audioRef.current) {
        audioRef.current.play().then(() => {
          setIsPlaying(true)
          setHasInteracted(true)
        }).catch(() => {
          // Autoplay blocked or not allowed yet
        })
      }
    }
    
    // Listen for any interaction
    window.addEventListener('click', handleInteraction)
    window.addEventListener('touchstart', handleInteraction)
    
    return () => {
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
    }
  }, [hasInteracted])

  // Move to the next track when the current one finishes
  const handleTrackEnd = () => {
    const nextIndex = (currentTrackIndex + 1) % PLAYLIST.length
    setCurrentTrackIndex(nextIndex)
  }

  // Automatically start playing the next track if it was already playing
  useEffect(() => {
    if (audioRef.current && hasInteracted && isPlaying) {
      audioRef.current.play().catch(() => {})
    }
  }, [currentTrackIndex, hasInteracted, isPlaying])

  const toggleAudio = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the global click listener
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
        setHasInteracted(true)
      }
    }
  }

  const nextTrack = (e: React.MouseEvent) => {
    e.stopPropagation()
    handleTrackEnd() // Manually trigger track end logic to skip
  }

  return (
    <>
      <audio 
        ref={audioRef} 
        src={PLAYLIST[currentTrackIndex]} 
        onEnded={handleTrackEnd}
      />
      
      {/* Floating Audio Controls */}
      <div className="fixed bottom-24 right-4 z-[100] flex flex-col items-center gap-2">
        {/* Next Track Button (Only visible after first interaction so they know it's a playlist) */}
        {hasInteracted && (
          <button 
            onClick={nextTrack}
            className="w-8 h-8 bg-black/60 backdrop-blur-md border border-[#333] rounded-full flex items-center justify-center text-white hover:border-white transition-colors"
            title="Skip Track"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 4 15 12 5 20 5 4"></polygon>
              <line x1="19" y1="5" x2="19" y2="19"></line>
            </svg>
          </button>
        )}

        {/* Play/Pause Toggle Icon */}
        <button 
          onClick={toggleAudio}
          className="w-10 h-10 bg-black/60 backdrop-blur-md border border-[#333] rounded-full flex items-center justify-center text-white hover:border-white transition-colors"
          title="Toggle Background Music"
        >
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <line x1="23" y1="9" x2="17" y2="15"></line>
              <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
          )}
        </button>
      </div>
    </>
  )
}
