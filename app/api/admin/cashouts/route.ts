import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { data: cashouts, error } = await supabase
      .from('cashout_requests')
      .select('*, players(name, photo_url, country)')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ cashouts: cashouts || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch cashouts' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !['completed', 'approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ error: 'Valid id and status are required' }, { status: 400 })
    }

    // Fetch cashout record first
    const { data: cashout, error: fetchErr } = await supabase
      .from('cashout_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !cashout) {
      return NextResponse.json({ error: 'Cashout request not found' }, { status: 404 })
    }

    // If rejecting, refund CR balance back to player
    if (status === 'rejected' && cashout.status !== 'rejected') {
      const { data: player } = await supabase
        .from('players')
        .select('balance')
        .eq('id', cashout.player_id)
        .single()

      if (player) {
        const refundedBalance = Number(player.balance || 0) + Number(cashout.cr_amount)
        await supabase
          .from('players')
          .update({ balance: refundedBalance })
          .eq('id', cashout.player_id)
      }
    }

    // Update status
    const { data: updated, error: updateErr } = await supabase
      .from('cashout_requests')
      .update({ status })
      .eq('id', id)
      .select('*, players(name, photo_url)')
      .single()

    if (updateErr) throw updateErr

    return NextResponse.json({ success: true, cashout: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update cashout status' }, { status: 500 })
  }
}
