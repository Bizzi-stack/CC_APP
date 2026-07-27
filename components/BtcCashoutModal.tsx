'use client'

import React, { useState, useEffect } from 'react'
import BtcTicker from './BtcTicker'
import { BtcPriceInfo } from '@/lib/btc'

interface BtcCashoutModalProps {
  playerBalance: number
  onSuccess?: (newBalance: number) => void
}

export default function BtcCashoutModal({ playerBalance, onSuccess }: BtcCashoutModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [btcAddress, setBtcAddress] = useState('')
  const [crAmount, setCrAmount] = useState(1000000)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successData, setSuccessData] = useState<any>(null)
  const [btcPriceInfo, setBtcPriceInfo] = useState<BtcPriceInfo | null>(null)

  const REQUIRED_CR = 1000000
  const canCashout = playerBalance >= REQUIRED_CR
  const progressPercent = Math.min(100, (playerBalance / REQUIRED_CR) * 100)

  useEffect(() => {
    fetch('/api/btc-price')
      .then(res => res.json())
      .then(data => setBtcPriceInfo(data))
      .catch(() => {})
  }, [])

  const handleCashoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!btcAddress.trim()) {
      setError('Please enter a valid Bitcoin wallet address')
      return
    }

    setLoading(true)
    setError('')
    setSuccessData(null)

    try {
      const res = await fetch('/api/player/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          btc_address: btcAddress.trim(),
          cr_amount: crAmount
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Cash out failed')

      setSuccessData(data)
      if (onSuccess) onSuccess(data.new_balance)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const liveBtcFor1m = btcPriceInfo ? (50 / btcPriceInfo.priceUsd) : 0.00052

  return (
    <>
      {/* Trigger Card Component */}
      <div className="bg-gradient-to-br from-amber-950/40 via-black to-[#0c0a00] border border-amber-500/40 rounded-2xl p-4 shadow-xl text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-extrabold text-lg shadow-inner">
              ₿
            </div>
            <div>
              <h3 className="text-xs font-black uppercase text-amber-300 tracking-wider">
                Bitcoin (BTC) Cash Out
              </h3>
              <p className="text-[9px] text-[#aaa] font-mono">
                1,000,000 CR = $50.00 USD in BTC
              </p>
            </div>
          </div>

          <BtcTicker showConversionHint={false} className="hidden sm:inline-flex" />
        </div>

        {/* Balance Progress Bar */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-[#888]">Balance Progress:</span>
            <span className={canCashout ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {playerBalance.toLocaleString()} / {REQUIRED_CR.toLocaleString()} CR ({progressPercent.toFixed(0)}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-black border border-[#222] rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                canCashout
                  ? 'bg-gradient-to-r from-amber-500 via-emerald-400 to-emerald-300 shadow-glow'
                  : 'bg-gradient-to-r from-amber-600 to-amber-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Cashout Button */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`w-full h-11 rounded-xl text-xs font-extrabold tracking-widest uppercase flex items-center justify-center gap-2 transition-all ${
            canCashout
              ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black shadow-lg hover:brightness-110 active:scale-[0.99]'
              : 'bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
          }`}
        >
          <span>₿</span>
          <span>{canCashout ? 'Cash Out BTC ($50 USD)' : 'View BTC Cash Out Details'}</span>
        </button>
      </div>

      {/* Cash Out Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#0a0a0a] border border-amber-500/40 p-6 rounded-2xl shadow-2xl space-y-4 text-left"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 text-lg font-black">
                  ₿
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-amber-300 tracking-wider">
                    Bitcoin (BTC) Cash Out
                  </h3>
                  <p className="text-[9px] text-[#888] font-mono">
                    Direct Payout to Your BTC Wallet
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-[#1c1c1c] hover:bg-[#333] text-[#aaa] hover:text-white flex items-center justify-center text-xs font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Live Ticker Banner */}
            <BtcTicker showConversionHint={true} className="w-full" />

            {/* Success State Receipt */}
            {successData ? (
              <div className="bg-emerald-950/30 border border-emerald-500/40 p-4 rounded-xl space-y-2 text-center">
                <div className="text-3xl">🎉</div>
                <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wide">
                  Cash Out Requested!
                </h4>
                <p className="text-xs text-[#ccc] leading-relaxed">
                  You successfully submitted a request to cash out <strong className="text-white">1,000,000 CR</strong> for <strong className="text-amber-300">${successData.usd_value.toFixed(2)} USD in BTC</strong> (≈ {successData.btc_amount.toFixed(6)} BTC).
                </p>
                <div className="bg-black/60 p-2.5 rounded-lg border border-[#222] text-left text-[10px] font-mono space-y-1 text-[#aaa]">
                  <p><span className="text-[#666]">Payout Address:</span> <span className="text-amber-300 break-all">{successData.btc_address}</span></p>
                  <p><span className="text-[#666]">Status:</span> <span className="text-emerald-400 font-bold uppercase">Pending Admin Approval</span></p>
                  <p><span className="text-[#666]">New CR Balance:</span> <span className="text-white font-bold">{successData.new_balance.toLocaleString()} CR</span></p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="mt-2 w-full h-9 bg-white text-black text-xs font-bold uppercase tracking-wider rounded-lg"
                >
                  Done
                </button>
              </div>
            ) : (
              /* Cashout Form */
              <form onSubmit={handleCashoutSubmit} className="space-y-4">
                <div className="bg-black/60 border border-[#222] p-3 rounded-xl space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-[#888]">
                    <span>Conversion Rate:</span>
                    <span className="text-amber-400 font-bold">1,000,000 CR = $50.00 USD</span>
                  </div>
                  <div className="flex justify-between text-[#888]">
                    <span>Your Current Balance:</span>
                    <span className="text-white font-bold">{playerBalance.toLocaleString()} CR</span>
                  </div>
                  <div className="flex justify-between text-[#888]">
                    <span>BTC Payout Amount:</span>
                    <span className="text-emerald-400 font-bold">≈ {liveBtcFor1m.toFixed(6)} BTC</span>
                  </div>
                </div>

                {!canCashout && (
                  <div className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl text-[11px] text-amber-300 leading-relaxed">
                    ⚠️ You need <strong>1,000,000 CR</strong> to cash out $50 USD in BTC. Play matches, collect wages, and trade players to reach 1,000,000 CR!
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#888] tracking-widest uppercase block">
                    Bitcoin Payout Wallet Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={btcAddress}
                    onChange={e => setBtcAddress(e.target.value)}
                    placeholder="e.g. bc1q... or Lightning address"
                    className="w-full h-11 px-3 bg-black border border-[#333] text-white text-xs font-mono outline-none focus:border-amber-400 transition-colors rounded-xl"
                  />
                  <p className="text-[9px] text-[#666]">Enter your Native SegWit (bc1q) or legacy BTC address.</p>
                </div>

                {error && (
                  <div className="border border-red-900 bg-red-900/10 text-red-400 text-xs p-3 rounded-xl">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canCashout || loading}
                  className="w-full h-12 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black text-xs font-extrabold tracking-widest uppercase rounded-xl transition-all disabled:opacity-40 disabled:pointer-events-none hover:brightness-110"
                >
                  {loading ? 'Processing Cash Out...' : `Cash Out 1,000,000 CR ($50 USD BTC)`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
