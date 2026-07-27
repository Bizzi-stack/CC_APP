export interface BtcPriceInfo {
  priceUsd: number
  btcFor1mCr: number // 1,000,000 CR = $50.00 USD worth of BTC
  usdValue: number   // $50.00 USD
  lastUpdated: string
}

const FALLBACK_BTC_PRICE = 96500 // Fallback spot price in USD if API fails

export async function fetchLiveBtcPrice(): Promise<BtcPriceInfo> {
  try {
    const res = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot', {
      next: { revalidate: 60 }, // Cache for 60 seconds
      headers: { 'User-Agent': 'TheCircleFC/1.0' }
    })
    
    if (!res.ok) throw new Error('Coinbase API error')
    const data = await res.json()
    const priceUsd = parseFloat(data?.data?.amount) || FALLBACK_BTC_PRICE
    const usdValue = 50.00
    const btcFor1mCr = usdValue / priceUsd

    return {
      priceUsd,
      usdValue,
      btcFor1mCr,
      lastUpdated: new Date().toISOString()
    }
  } catch (err) {
    // Secondary fallback fetch via Binance or default
    try {
      const res2 = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT')
      if (res2.ok) {
        const data2 = await res2.json()
        const priceUsd = parseFloat(data2?.price) || FALLBACK_BTC_PRICE
        return {
          priceUsd,
          usdValue: 50.00,
          btcFor1mCr: 50.00 / priceUsd,
          lastUpdated: new Date().toISOString()
        }
      }
    } catch {
      // Fallback
    }

    return {
      priceUsd: FALLBACK_BTC_PRICE,
      usdValue: 50.00,
      btcFor1mCr: 50.00 / FALLBACK_BTC_PRICE,
      lastUpdated: new Date().toISOString()
    }
  }
}
