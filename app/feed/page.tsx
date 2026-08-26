'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import BottomNav from '@/components/BottomNav'
import PublicNav from '@/components/PublicNav'
import VerificationBadge from '@/components/VerificationBadge'

interface TaggedPlayer {
  id: string
  name: string
  photo_url?: string
  verification_badge?: string
}

interface Post {
  id: string
  author_id?: string
  author_name: string
  author_avatar?: string
  author_badge?: string
  author_verification?: string
  content: string
  image_url?: string
  tagged_players?: TaggedPlayer[]
  likes_count: number
  reposts_count: number
  comments_count: number
  created_at: string
}

interface Comment {
  id: string
  post_id: string
  author_name: string
  author_avatar?: string
  content: string
  created_at: string
}

export default function LockerRoomFeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activePlayer, setActivePlayer] = useState<any>(null)
  const [allPlayers, setAllPlayers] = useState<any[]>([])
  const [userLikedPostIds, setUserLikedPostIds] = useState<string[]>([])
  const [userRepostedPostIds, setUserRepostedPostIds] = useState<string[]>([])

  // New post composer state
  const [newContent, setNewContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [selectedTaggedPlayerIds, setSelectedTaggedPlayerIds] = useState<string[]>([])
  const [showTagModal, setShowTagModal] = useState(false)
  const [mentionSearch, setMentionSearch] = useState('')
  const [showMentionDropdown, setShowMentionDropdown] = useState(false)

  const [posting, setPosting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Comments drawer state
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null)
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({})
  const [commentInputMap, setCommentInputMap] = useState<Record<string, string>>({})
  const [submittingCommentId, setSubmittingCommentId] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Fetch logged in user profile, active players list & feed posts
  useEffect(() => {
    // 1. Check logged in player
    fetch('/api/player/me')
      .then(r => r.json())
      .then(data => {
        if (data.player) setActivePlayer(data.player)
      })
      .catch(() => {})

    // 2. Fetch players for tagging
    fetch('/api/players?status=active')
      .then(r => r.json())
      .then(data => {
        setAllPlayers(data.players || [])
      })
      .catch(() => {})

    // 3. Fetch posts
    fetchFeed()
  }, [])

  const fetchFeed = async () => {
    try {
      const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('player_token') || 'guest' : 'guest'
      const res = await fetch(`/api/feed?userId=${storedUserId}`)
      const data = await res.json()
      if (res.ok) {
        setPosts(data.posts || [])
        setUserLikedPostIds(data.userLikedPostIds || [])
        setUserRepostedPostIds(data.userRepostedPostIds || [])
      }
    } catch (err) {
      console.error('Feed error:', err)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Handle Image Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be under 5MB')
      return
    }
    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  // Handle Submit New Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newContent.trim() && !imageFile) return
    setPosting(true)

    try {
      let uploadedImageUrl: string | null = null

      // Upload photo if attached
      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData })
        const uploadData = await uploadRes.json()
        if (uploadRes.ok) {
          uploadedImageUrl = uploadData.url
        }
      }

      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_id: activePlayer?.id || null,
          author_name: activePlayer?.name || 'Guest Fan',
          author_avatar: activePlayer?.photo_url || null,
          author_badge: activePlayer ? (activePlayer.is_franchise_owner ? 'FRANCHISE OWNER' : 'UWIFA PLAYER') : 'FAN',
          content: newContent.trim(),
          image_url: uploadedImageUrl,
          tagged_player_ids: selectedTaggedPlayerIds
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to post')

      setNewContent('')
      setImageFile(null)
      setImagePreview(null)
      setSelectedTaggedPlayerIds([])
      if (fileInputRef.current) fileInputRef.current.value = ''
      
      showToast('Post published!')
      fetchFeed()
    } catch (err: any) {
      alert(err.message || 'Error publishing post')
    } finally {
      setPosting(false)
    }
  }

  // Toggle Like
  const handleToggleLike = async (postId: string) => {
    const userId = activePlayer?.id || localStorage.getItem('player_token') || 'guest'
    const isLiked = userLikedPostIds.includes(postId)

    // Optimistic UI update
    setUserLikedPostIds(prev => isLiked ? prev.filter(id => id !== postId) : [...prev, postId])
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      likes_count: isLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1
    } : p))

    try {
      const res = await fetch('/api/feed/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
    } catch (err) {
      fetchFeed()
    }
  }

  // Toggle Repost
  const handleToggleRepost = async (postId: string) => {
    const userId = activePlayer?.id || localStorage.getItem('player_token') || 'guest'
    const isReposted = userRepostedPostIds.includes(postId)

    setUserRepostedPostIds(prev => isReposted ? prev.filter(id => id !== postId) : [...prev, postId])
    setPosts(prev => prev.map(p => p.id === postId ? {
      ...p,
      reposts_count: isReposted ? Math.max(0, p.reposts_count - 1) : p.reposts_count + 1
    } : p))

    try {
      const res = await fetch('/api/feed/repost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, userId })
      })
      const data = await res.json()
      if (res.ok && data.reposted) {
        showToast('Reposted to feed!')
      }
    } catch {
      fetchFeed()
    }
  }

  // Toggle Comments Drawer & Fetch Comments
  const handleToggleComments = async (postId: string) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null)
      return
    }

    setActiveCommentPostId(postId)
    if (!commentsMap[postId]) {
      try {
        const res = await fetch(`/api/feed/comment?postId=${postId}`)
        const data = await res.json()
        if (res.ok) {
          setCommentsMap(prev => ({ ...prev, [postId]: data.comments || [] }))
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  // Add Comment
  const handleAddComment = async (postId: string) => {
    const text = commentInputMap[postId]?.trim()
    if (!text) return

    setSubmittingCommentId(postId)

    try {
      const res = await fetch('/api/feed/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          author_name: activePlayer?.name || 'Guest Fan',
          author_avatar: activePlayer?.photo_url || null,
          content: text
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setCommentInputMap(prev => ({ ...prev, [postId]: '' }))
      setCommentsMap(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), data.comment]
      }))
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: data.comments_count } : p))
    } catch (err: any) {
      alert(err.message || 'Failed to add comment')
    } finally {
      setSubmittingCommentId(null)
    }
  }

  // Share Post Link
  const handleSharePost = (post: Post) => {
    const shareUrl = `${window.location.origin}/feed#post-${post.id}`
    if (navigator.share) {
      navigator.share({
        title: `Post by ${post.author_name} | The Circle Locker Room`,
        text: post.content,
        url: shareUrl
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(shareUrl)
      showToast('Post link copied to clipboard!')
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diffSec < 60) return `${diffSec}s ago`
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
    return `${Math.floor(diffSec / 86400)}d ago`
  }

  // Rich @ mention formatter
  const renderFormattedContent = (text: string) => {
    if (!text) return null
    const parts = text.split(/(@[a-zA-Z0-9_.\-\s]{2,20})/g)
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const queryName = part.substring(1).trim().toLowerCase()
        const matchedPlayer = allPlayers.find(p => p.name.toLowerCase() === queryName || p.name.toLowerCase().startsWith(queryName))
        if (matchedPlayer) {
          return (
            <Link
              key={index}
              href={`/player/${matchedPlayer.id}`}
              className="text-amber-400 font-bold hover:underline bg-amber-950/40 px-1 py-0.5 border border-amber-500/30 font-mono inline-block mx-0.5"
            >
              @{matchedPlayer.name}
            </Link>
          )
        }
        return (
          <span key={index} className="text-amber-400 font-bold font-mono">
            {part}
          </span>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  // Permission check for posting
  const canPost = activePlayer ? (activePlayer.can_post || activePlayer.status === 'active' || activePlayer.is_franchise_owner) : true

  return (
    <div className="min-h-screen bg-black text-white pb-28">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-400 text-black px-4 py-2 text-xs font-bold font-mono shadow-2xl animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Tag Players Modal */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowTagModal(false)}>
          <div className="w-full max-w-[400px] bg-[#0d0d0f] border border-[#333] p-5 space-y-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Tag Players / Teammates</h3>
              <button onClick={() => setShowTagModal(false)} className="text-[#888] hover:text-white text-xs font-bold">✕</button>
            </div>

            <p className="text-[10px] text-[#888] font-mono">Select players featured in this photo or update:</p>

            <div className="flex-1 overflow-y-auto space-y-1.5 max-h-60 pr-1">
              {allPlayers.map(p => {
                const isSelected = selectedTaggedPlayerIds.includes(p.id)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedTaggedPlayerIds(prev =>
                        isSelected ? prev.filter(id => id !== p.id) : [...prev, p.id]
                      )
                    }}
                    className={`w-full p-2.5 flex items-center justify-between border transition-all text-left cursor-pointer ${
                      isSelected ? 'bg-amber-400/10 border-amber-400 text-amber-300' : 'bg-[#121215] border-[#222] text-[#ccc] hover:border-[#444]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full overflow-hidden border border-[#333] bg-[#222] shrink-0 flex items-center justify-center">
                        {p.photo_url ? (
                          <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold text-[#888]">{p.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold">{p.name}</span>
                          <VerificationBadge type={p.is_franchise_owner ? 'red' : p.verification_badge} className="w-[14px] h-[14px]" />
                        </div>
                      </div>
                    </div>

                    <span className="text-xs font-bold font-mono">
                      {isSelected ? '✓ Tagged' : '+ Tag'}
                    </span>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowTagModal(false)}
              className="w-full h-10 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
            >
              Done Tagging ({selectedTaggedPlayerIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-[#1a1a1a] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-bold uppercase tracking-widest text-white">The Locker Room</h1>
        </div>
        <span className="text-[10px] font-mono text-amber-400 border border-amber-500/40 bg-amber-950/30 px-2 py-0.5 uppercase tracking-wider">
          Live Community Feed
        </span>
      </div>

      <div className="max-w-[480px] mx-auto px-4 pt-4 space-y-4">

        {/* Composer Box (For Logged in creators / members) */}
        <div className="bg-[#0b0b0d] border border-[#222] p-4 space-y-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-[#333] bg-[#1a1a1a] shrink-0 flex items-center justify-center">
              {activePlayer?.photo_url ? (
                <img src={activePlayer.photo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-[#888]">{activePlayer?.name ? activePlayer.name.charAt(0) : '⚽'}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p className="text-xs font-bold text-white">{activePlayer?.name || 'Locker Room Member'}</p>
                <VerificationBadge type={activePlayer?.is_franchise_owner ? 'red' : activePlayer?.verification_badge} className="w-[18px] h-[18px]" />
              </div>
              <p className="text-[9px] text-[#666] uppercase font-mono">{activePlayer?.is_franchise_owner ? 'Franchise Owner' : (activePlayer ? 'Verified Player' : 'Community Fan')}</p>
            </div>
          </div>

          <form onSubmit={handleCreatePost} className="space-y-3">
            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="What's happening in the tournament? Type @Name to mention a player..."
              className="w-full min-h-[85px] bg-[#111] border border-[#262626] text-white text-xs p-3 outline-none focus:border-white transition-colors resize-none placeholder-[#555] font-sans"
            />

            {/* Selected Tagged Players Chips */}
            {selectedTaggedPlayerIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-[#121215] border border-amber-500/30">
                <span className="text-[10px] text-amber-400 font-bold font-mono self-center flex items-center gap-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span>Tagged:</span>
                </span>
                {selectedTaggedPlayerIds.map(id => {
                  const p = allPlayers.find(item => item.id === id)
                  if (!p) return null
                  return (
                    <span key={id} className="text-[10px] font-bold text-white bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 flex items-center gap-1">
                      <span>@{p.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedTaggedPlayerIds(prev => prev.filter(tId => tId !== id))}
                        className="hover:text-red-400 font-bold ml-1"
                      >
                        ✕
                      </button>
                    </span>
                  )
                })}
              </div>
            )}

            {/* Attached Photo Preview */}
            {imagePreview && (
              <div className="relative w-full aspect-video border border-[#333] overflow-hidden bg-black">
                <img src={imagePreview} alt="Attached upload" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 bg-black/80 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <label className="cursor-pointer flex items-center gap-1.5 text-xs text-[#888] hover:text-white transition-colors font-mono">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span>Photo</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setShowTagModal(true)}
                  className="flex items-center gap-1.5 text-xs text-[#888] hover:text-amber-400 transition-colors font-mono cursor-pointer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span>Tag ({selectedTaggedPlayerIds.length})</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={posting || (!newContent.trim() && !imageFile)}
                className="px-5 py-2 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-gray-200 disabled:opacity-40 transition-all cursor-pointer active:scale-95"
              >
                {posting ? 'Publishing...' : 'POST UPDATE'}
              </button>
            </div>
          </form>
        </div>

        {/* Posts Stream */}
        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-[#666] uppercase animate-pulse">
            Loading Locker Room Feed...
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-[#09090b] border border-[#222] p-8 text-center space-y-2">
            <p className="text-sm font-bold text-white uppercase tracking-wider">No updates posted yet</p>
            <p className="text-xs text-[#666]">Be the first to share an update or photo in the Locker Room!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => {
              const isLiked = userLikedPostIds.includes(post.id)
              const isReposted = userRepostedPostIds.includes(post.id)

              return (
                <div key={post.id} id={`post-${post.id}`} className="bg-[#0b0b0d] border border-[#1f1f23] p-4 space-y-3 hover:border-[#333] transition-colors">
                  {/* Post Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-[#333] bg-[#151518] shrink-0 flex items-center justify-center">
                        {post.author_avatar ? (
                          <img src={post.author_avatar} alt={post.author_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-[#666]">{post.author_name.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-white">{post.author_name}</p>
                          <VerificationBadge type={post.author_verification} className="w-[18px] h-[18px]" />
                          <span className="text-[8px] font-bold text-amber-400 border border-amber-500/40 bg-amber-950/20 px-1 py-0.2 uppercase">
                            {post.author_badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#666] font-mono mt-0.5">{formatTimeAgo(post.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Post Text Content with Rich @ Mentions */}
                  {post.content && (
                    <p className="text-xs text-[#e4e4e7] leading-relaxed whitespace-pre-line font-sans">
                      {renderFormattedContent(post.content)}
                    </p>
                  )}

                  {/* Tagged Players Chips Section */}
                  {post.tagged_players && post.tagged_players.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-[#888] font-mono flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        <span>Tagged:</span>
                      </span>
                      {post.tagged_players.map(tp => (
                        <Link
                          key={tp.id}
                          href={`/player/${tp.id}`}
                          className="text-[10px] font-bold text-amber-300 bg-amber-950/30 border border-amber-500/30 hover:border-amber-400 px-2 py-0.5 flex items-center gap-1 transition-colors"
                        >
                          {tp.photo_url && <img src={tp.photo_url} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />}
                          <span>@{tp.name}</span>
                          <VerificationBadge type={tp.verification_badge} className="w-[12px] h-[12px]" />
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Post Image Content */}
                  {post.image_url && (
                    <div className="w-full aspect-video border border-[#222] overflow-hidden bg-black">
                      <img
                        src={post.image_url}
                        alt="Post media"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onClick={() => window.open(post.image_url, '_blank')}
                      />
                    </div>
                  )}

                  {/* Social Action Bar (Like, Repost, Comment, Share) */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#18181b] text-[#888]">

                    {/* Like */}
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1.5 text-xs font-mono transition-colors cursor-pointer ${
                        isLiked ? 'text-rose-500 font-bold' : 'hover:text-white'
                      }`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? '#f43f5e' : 'none'} stroke={isLiked ? '#f43f5e' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                      </svg>
                      <span>{post.likes_count}</span>
                    </button>

                    {/* Repost */}
                    <button
                      onClick={() => handleToggleRepost(post.id)}
                      className={`flex items-center gap-1.5 text-xs font-mono transition-colors cursor-pointer ${
                        isReposted ? 'text-emerald-400 font-bold' : 'hover:text-white'
                      }`}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="17 1 21 5 17 9"/>
                        <path d="M3 11V9a4 4 0 014-4h14"/>
                        <polyline points="7 23 3 19 7 15"/>
                        <path d="M21 13v2a4 4 0 01-4 4H3"/>
                      </svg>
                      <span>{post.reposts_count}</span>
                    </button>

                    {/* Comment */}
                    <button
                      onClick={() => handleToggleComments(post.id)}
                      className="flex items-center gap-1.5 text-xs font-mono hover:text-white transition-colors cursor-pointer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                      </svg>
                      <span>{post.comments_count}</span>
                    </button>

                    {/* Share */}
                    <button
                      onClick={() => handleSharePost(post)}
                      className="flex items-center gap-1.5 text-xs font-mono hover:text-white transition-colors cursor-pointer"
                      title="Share post"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
                        <polyline points="16 6 12 2 8 6"/>
                        <line x1="12" y1="2" x2="12" y2="15"/>
                      </svg>
                      <span>Share</span>
                    </button>

                  </div>

                  {/* Comments Drawer Section */}
                  {activeCommentPostId === post.id && (
                    <div className="pt-3 border-t border-[#1a1a1e] space-y-3">
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {!commentsMap[post.id] ? (
                          <p className="text-[10px] text-[#666] font-mono">Loading comments...</p>
                        ) : commentsMap[post.id].length === 0 ? (
                          <p className="text-[10px] text-[#666] font-mono">No comments yet. Start the conversation!</p>
                        ) : (
                          commentsMap[post.id].map(comment => (
                            <div key={comment.id} className="bg-[#121215] p-2.5 border border-[#222] text-xs space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-[#888]">
                                <span className="font-bold text-amber-400">{comment.author_name}</span>
                                <span className="font-mono">{formatTimeAgo(comment.created_at)}</span>
                              </div>
                              <p className="text-white text-xs">{renderFormattedContent(comment.content)}</p>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Comment Input Box */}
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={commentInputMap[post.id] || ''}
                          onChange={e => setCommentInputMap(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && handleAddComment(post.id)}
                          placeholder="Write a comment..."
                          className="flex-1 h-9 px-3 bg-[#111] border border-[#2a2a2a] text-white text-xs outline-none focus:border-white transition-colors"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          disabled={submittingCommentId === post.id || !commentInputMap[post.id]?.trim()}
                          className="h-9 px-3 bg-white text-black text-xs font-bold uppercase tracking-wider disabled:opacity-40"
                        >
                          {submittingCommentId === post.id ? '...' : 'Reply'}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )
            })}
          </div>
        )}

      </div>

      {/* Navigation Bars */}
      {activePlayer ? <BottomNav /> : <PublicNav />}
    </div>
  )
}
