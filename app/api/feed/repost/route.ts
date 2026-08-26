import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { postId, userId } = await request.json()

    if (!postId || !userId) {
      return NextResponse.json({ error: 'postId and userId are required' }, { status: 400 })
    }

    const { data: existingRepost } = await supabase
      .from('post_reposts')
      .select('id')
      .eq('post_id', postId)
      .eq('user_identifier', userId)
      .single()

    if (existingRepost) {
      // Undo repost
      await supabase.from('post_reposts').delete().eq('id', existingRepost.id)
      
      const { data: post } = await supabase.from('community_posts').select('reposts_count').eq('id', postId).single()
      const newCount = Math.max(0, (post?.reposts_count || 1) - 1)
      await supabase.from('community_posts').update({ reposts_count: newCount }).eq('id', postId)

      return NextResponse.json({ reposted: false, reposts_count: newCount })
    } else {
      // Repost
      await supabase.from('post_reposts').insert([{ post_id: postId, user_identifier: userId }])

      const { data: post } = await supabase.from('community_posts').select('reposts_count').eq('id', postId).single()
      const newCount = (post?.reposts_count || 0) + 1
      await supabase.from('community_posts').update({ reposts_count: newCount }).eq('id', postId)

      return NextResponse.json({ reposted: true, reposts_count: newCount })
    }
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update repost' }, { status: 500 })
  }
}
