import { NextResponse } from 'next/server'
import { fetchLiveBtcPrice } from '@/lib/btc'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const btcInfo = await fetchLiveBtcPrice()
    return NextResponse.json(btcInfo)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch BTC price' }, { status: 500 })
  }
}
