import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { postId, userId } = await request.json()

    if (!postId || !userId) {
      return NextResponse.json({ error: 'postId and userId are required' }, { status: 400 })
    }

    // Check if user already liked this post
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_identifier', userId)
      .single()

    if (existingLike) {
      // Unlike
      await supabase.from('post_likes').delete().eq('id', existingLike.id)
      
      // Decrement likes count
      const { data: post } = await supabase.from('community_posts').select('likes_count').eq('id', postId).single()
      const newCount = Math.max(0, (post?.likes_count || 1) - 1)
      await supabase.from('community_posts').update({ likes_count: newCount }).eq('id', postId)

      return NextResponse.json({ liked: false, likes_count: newCount })
    } else {
      // Like
      await supabase.from('post_likes').insert([{ post_id: postId, user_identifier: userId }])

      // Increment likes count
      const { data: post } = await supabase.from('community_posts').select('likes_count').eq('id', postId).single()
      const newCount = (post?.likes_count || 0) + 1
      await supabase.from('community_posts').update({ likes_count: newCount }).eq('id', postId)

      return NextResponse.json({ liked: true, likes_count: newCount })
    }
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update like' }, { status: 500 })
  }
}
