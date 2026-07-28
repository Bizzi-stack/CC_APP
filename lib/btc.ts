export interface BtcPriceInfo {
  priceUsd: number
  btcFor1mCr: number // 1,000,000 CR = $50.00 USD worth of BTC
  usdValue: number   // $50.00 USD
  lastUpdated: string
}

const FALLBACK_BTC_PRICE = 96500

// Ultra-fast in-memory cache (15 seconds TTL)
let cachedBtcInfo: BtcPriceInfo | null = null
let cacheTimestamp = 0

export async function fetchLiveBtcPrice(): Promise<BtcPriceInfo> {
  const now = Date.now()
  if (cachedBtcInfo && (now - cacheTimestamp < 15000)) {
    return cachedBtcInfo
  }

  try {
    const res = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot', {
      headers: { 'User-Agent': 'TheCircleFC/1.0' },
      signal: AbortSignal.timeout(3500)
    })
    
    if (res.ok) {
      const data = await res.json()
      const priceUsd = parseFloat(data?.data?.amount) || FALLBACK_BTC_PRICE
      cachedBtcInfo = {
        priceUsd,
        usdValue: 50.00,
        btcFor1mCr: 50.00 / priceUsd,
        lastUpdated: new Date().toISOString()
      }
      cacheTimestamp = now
      return cachedBtcInfo
    }
  } catch (err) {
    // Secondary fallback fetch via Binance
    try {
      const res2 = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', {
        signal: AbortSignal.timeout(3500)
      })
      if (res2.ok) {
        const data2 = await res2.json()
        const priceUsd = parseFloat(data2?.price) || FALLBACK_BTC_PRICE
        cachedBtcInfo = {
          priceUsd,
          usdValue: 50.00,
          btcFor1mCr: 50.00 / priceUsd,
          lastUpdated: new Date().toISOString()
        }
        cacheTimestamp = now
        return cachedBtcInfo
      }
    } catch {
      // Ignore
    }
  }

  // Return last cached or default fallback
  if (cachedBtcInfo) return cachedBtcInfo

  return {
    priceUsd: FALLBACK_BTC_PRICE,
    usdValue: 50.00,
    btcFor1mCr: 50.00 / FALLBACK_BTC_PRICE,
    lastUpdated: new Date().toISOString()
  }
}
