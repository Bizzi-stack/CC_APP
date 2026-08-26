import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 })
    }

    const { data: comments, error } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ comments: comments || [] })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { postId, author_name, author_avatar, content } = await request.json()

    if (!postId || !content?.trim()) {
      return NextResponse.json({ error: 'postId and content are required' }, { status: 400 })
    }

    const { data: comment, error } = await supabase
      .from('post_comments')
      .insert([{
        post_id: postId,
        author_name: author_name || 'Guest Fan',
        author_avatar: author_avatar || null,
        content: content.trim()
      }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Increment comments count on post
    const { data: post } = await supabase.from('community_posts').select('comments_count').eq('id', postId).single()
    const newCount = (post?.comments_count || 0) + 1
    await supabase.from('community_posts').update({ comments_count: newCount }).eq('id', postId)

    return NextResponse.json({ comment, comments_count: newCount }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}
