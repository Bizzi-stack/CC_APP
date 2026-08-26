import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'guest'

    const { data: posts, error } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch author verification badges and tagged players data
    const authorIds = Array.from(new Set((posts || []).map(p => p.author_id).filter(Boolean)))
    const allTaggedIds = Array.from(new Set((posts || []).flatMap(p => p.tagged_player_ids || []).filter(Boolean)))
    const allPlayerIdsNeeded = Array.from(new Set([...authorIds, ...allTaggedIds]))

    let playerMap: Record<string, any> = {}

    if (allPlayerIdsNeeded.length > 0) {
      const { data: playersList } = await supabase
        .from('players')
        .select('id, name, photo_url, verification_badge, is_franchise_owner')
        .in('id', allPlayerIdsNeeded)

      if (playersList) {
        playersList.forEach(p => {
          playerMap[p.id] = {
            ...p,
            verification_badge: p.is_franchise_owner ? 'red' : (p.verification_badge || 'none')
          }
        })
      }
    }

    const formattedPosts = (posts || []).map(p => {
      const taggedPlayers = (p.tagged_player_ids || [])
        .map((id: string) => playerMap[id])
        .filter(Boolean)

      return {
        ...p,
        author_verification: p.author_id ? (playerMap[p.author_id]?.verification_badge || p.author_verification || 'none') : (p.author_verification || 'none'),
        tagged_players: taggedPlayers
      }
    })

    // Fetch user liked post IDs
    let userLikedPostIds: string[] = []
    let userRepostedPostIds: string[] = []

    if (userId) {
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_identifier', userId)

      if (likes) {
        userLikedPostIds = likes.map(l => l.post_id)
      }

      const { data: reposts } = await supabase
        .from('post_reposts')
        .select('post_id')
        .eq('user_identifier', userId)

      if (reposts) {
        userRepostedPostIds = reposts.map(r => r.post_id)
      }
    }

    return NextResponse.json({
      posts: formattedPosts,
      userLikedPostIds,
      userRepostedPostIds
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load feed' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { author_id, author_name, author_avatar, author_badge, content, image_url, tagged_player_ids } = body

    if (!content && !image_url) {
      return NextResponse.json({ error: 'Post content or image is required' }, { status: 400 })
    }

    let verificationBadge = 'none'

    // Verify creator permission if author_id is provided
    if (author_id) {
      const { data: player } = await supabase
        .from('players')
        .select('can_post, status, is_franchise_owner, verification_badge')
        .eq('id', author_id)
        .single()

      // Allow if player is active, franchise owner, or has explicit can_post permission
      const canPost = player?.can_post || player?.status === 'active' || player?.is_franchise_owner
      if (!canPost) {
        return NextResponse.json({ error: 'You do not have permission to post to the feed' }, { status: 403 })
      }

      if (player?.is_franchise_owner) {
        verificationBadge = 'red'
      } else if (player?.verification_badge) {
        verificationBadge = player.verification_badge
      }
    }

    const { data: newPost, error } = await supabase
      .from('community_posts')
      .insert([{
        author_id: author_id || null,
        author_name: author_name || 'Anonymous Player',
        author_avatar: author_avatar || null,
        author_badge: author_badge || 'MEMBER',
        author_verification: verificationBadge,
        content: content || '',
        image_url: image_url || null,
        tagged_player_ids: Array.isArray(tagged_player_ids) ? tagged_player_ids : [],
        likes_count: 0,
        reposts_count: 0,
        comments_count: 0
      }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ post: newPost }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
