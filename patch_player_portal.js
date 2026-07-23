const fs = require('fs')

const path = 'app/player-portal/page.tsx'
let content = fs.readFileSync(path, 'utf8')

// 1. Add Wager interfaces and states
const interfaceRegex = /interface Player \{/
const wagerInterfaces = `interface FranchiseMatch {
  id: string
  challenger_id: string
  challenged_id: string
  wager_amount: number
  status: string
  created_at: string
  challenger: { id: string, name: string, logo_url: string | null }
  challenged: { id: string, name: string, logo_url: string | null }
}

interface PlayerWager {
  id: string
  challenge_id: string
  predicted_winner_id: string | null
  wager_amount: number
  status: string
  challenge: FranchiseMatch
  predicted_winner: { id: string, name: string, logo_url: string | null } | null
}

interface Player {`
content = content.replace(interfaceRegex, wagerInterfaces)

const stateRegex = /const \[incomingOffers, setIncomingOffers\] = useState<any\[\]>\(\[\]\)/
const wagerStates = `const [incomingOffers, setIncomingOffers] = useState<any[]>([])
  
  // Sportsbook State
  const [activeMatches, setActiveMatches] = useState<FranchiseMatch[]>([])
  const [myWagers, setMyWagers] = useState<PlayerWager[]>([])
  const [bettingMatch, setBettingMatch] = useState<FranchiseMatch | null>(null)
  const [betAmount, setBetAmount] = useState('')
  const [betPick, setBetPick] = useState<string | null>(null) // null for draw, id for franchise`
content = content.replace(stateRegex, wagerStates)

// 2. Fetch matches and wagers in fetchPortalData
const fetchPromiseRegex = /fetch\('\/api\/player\/offers'\)\n\s+\]\)/
content = content.replace(fetchPromiseRegex, `fetch('/api/player/offers'),
        fetch('/api/player/matches'),
        fetch('/api/player/wagers')
      ])`)

const meResRegex = /const \[meRes, badgesRes, offersRes\] = await Promise\.all/
content = content.replace(meResRegex, `const [meRes, badgesRes, offersRes, matchesRes, wagersRes] = await Promise.all`)

const jsonRegex = /const offersData = await offersRes\.json\(\)/
content = content.replace(jsonRegex, `const offersData = await offersRes.json()
      const matchesData = await matchesRes?.json() || { matches: [] }
      const wagersData = await wagersRes?.json() || { wagers: [] }`)

const setOffersRegex = /setIncomingOffers\(offersData\.offers \|\| \[\]\)/
content = content.replace(setOffersRegex, `setIncomingOffers(offersData.offers || [])
      setActiveMatches(matchesData.matches || [])
      setMyWagers(wagersData.wagers || [])`)

// 3. Add handlePlaceBet function
const funcRegex = /const handleRespondOffer = async/
const handleBetFunc = `const handlePlaceBet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bettingMatch) return
    const amount = parseInt(betAmount)
    if (isNaN(amount) || amount <= 0) return await showDialog({ type: 'alert', message: 'Invalid wager amount' })
    if (player && player.balance < amount) return await showDialog({ type: 'alert', message: 'Insufficient CR balance' })

    try {
      const res = await fetch('/api/player/wagers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          challenge_id: bettingMatch.id, 
          predicted_winner_id: betPick, 
          wager_amount: amount 
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to place bet')

      await showDialog({ type: 'alert', message: 'Bet placed successfully!' })
      setBettingMatch(null)
      setBetAmount('')
      setBetPick(null)
      await fetchPortalData()
    } catch (err: any) {
      await showDialog({ type: 'alert', message: err.message })
    }
  }

  const handleRespondOffer = async`
content = content.replace(funcRegex, handleBetFunc)

// 4. Inject Sportsbook UI Section
// I will put it right before the "Badge Shop" section.
const shopSectionRegex = /{!\(isBusiness && !player\.franchise_id\) && \(\s*<div className="bg-\[\#0a0a0a\] border border-\[\#222\] p-6 overflow-hidden relative">/
const sportsbookSection = `{!isBusiness && (
          <div className="bg-[#0a0a0a] border border-[#222] p-6 col-span-full md:col-span-1 lg:col-span-2 relative">
            <h2 className="text-xl font-bold uppercase tracking-widest text-amber-500 mb-6 flex items-center gap-2">
              Sportsbook <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full">BETA</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Active Matches */}
              <div>
                <h3 className="text-white font-bold tracking-widest uppercase text-sm mb-4">Live Matches</h3>
                <div className="space-y-4">
                  {activeMatches.length === 0 ? (
                    <p className="text-[#555] text-xs uppercase tracking-widest">No active matches to bet on</p>
                  ) : (
                    activeMatches.map(match => (
                      <div key={match.id} className="border border-[#333] bg-black p-4">
                        <div className="flex justify-between items-center mb-4">
                          <div className="text-center w-1/3">
                            {match.challenger.logo_url && <img src={match.challenger.logo_url} className="h-8 mx-auto mb-1 object-contain" />}
                            <p className="text-[10px] text-white font-bold uppercase">{match.challenger.name}</p>
                          </div>
                          <div className="text-center w-1/3 text-amber-500 text-[10px] font-bold uppercase tracking-widest">
                            VS
                          </div>
                          <div className="text-center w-1/3">
                            {match.challenged.logo_url && <img src={match.challenged.logo_url} className="h-8 mx-auto mb-1 object-contain" />}
                            <p className="text-[10px] text-white font-bold uppercase">{match.challenged.name}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setBettingMatch(match)}
                          className="w-full py-2 bg-white text-black font-bold uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-colors"
                        >
                          Place Bet
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* My Wagers */}
              <div>
                <h3 className="text-white font-bold tracking-widest uppercase text-sm mb-4">My Wagers</h3>
                <div className="space-y-4">
                  {myWagers.length === 0 ? (
                    <p className="text-[#555] text-xs uppercase tracking-widest">No wagers placed</p>
                  ) : (
                    myWagers.map(w => {
                      const pickName = w.predicted_winner_id === null ? 'Draw' : w.predicted_winner?.name
                      const isPending = w.status === 'pending'
                      const isWon = w.status === 'won'
                      
                      return (
                        <div key={w.id} className="border border-[#222] p-3 text-[10px] uppercase font-bold tracking-wider">
                          <div className="flex justify-between mb-2">
                            <span className="text-[#888]">Match:</span>
                            <span className="text-white">{w.challenge.challenger.name} vs {w.challenge.challenged.name}</span>
                          </div>
                          <div className="flex justify-between mb-2">
                            <span className="text-[#888]">Pick:</span>
                            <span className="text-white">{pickName}</span>
                          </div>
                          <div className="flex justify-between mb-2">
                            <span className="text-[#888]">Wager:</span>
                            <span className="text-white font-mono">{w.wager_amount.toLocaleString()} CR</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-[#222]">
                            <span className="text-[#888]">Status:</span>
                            <span className={isPending ? 'text-amber-500' : isWon ? 'text-green-500' : 'text-red-500'}>
                              {isPending ? 'Pending' : isWon ? \`Won (+\${w.wager_amount * 2} CR)\` : 'Lost'}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {!(isBusiness && !player.franchise_id) && (
          <div className="bg-[#0a0a0a] border border-[#222] p-6 overflow-hidden relative">`
content = content.replace(shopSectionRegex, sportsbookSection)

// 5. Add Betting Modal before final closing tags
const endRegex = /<DialogComponent \/>/
const bettingModalStr = `{/* Betting Modal */}
      {bettingMatch && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-[#222] p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold uppercase tracking-wide mb-2 text-white">Place Bet</h2>
            <p className="text-xs text-[#666] mb-6">
              Bet on the outcome of {bettingMatch.challenger.name} vs {bettingMatch.challenged.name}. Wins payout 2x.
            </p>

            <form onSubmit={handlePlaceBet} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-[#555]">
                  Select Winner
                </label>
                <select
                  required
                  value={betPick || 'draw'}
                  onChange={e => setBetPick(e.target.value === 'draw' ? null : e.target.value)}
                  className="w-full bg-[#111] border border-[#333] p-4 text-white focus:outline-none focus:border-white transition-colors text-sm font-bold uppercase"
                >
                  <option value={bettingMatch.challenger.id}>{bettingMatch.challenger.name}</option>
                  <option value="draw">Draw</option>
                  <option value={bettingMatch.challenged.id}>{bettingMatch.challenged.name}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-[#555]">
                  Wager Amount (CR)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={player?.balance || 0}
                  value={betAmount}
                  onChange={e => setBetAmount(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full bg-[#111] border border-[#333] p-4 text-white focus:outline-none focus:border-white transition-colors text-base font-bold font-mono"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 text-black font-bold tracking-widest uppercase p-4 hover:bg-amber-400 transition-colors text-xs"
                >
                  Confirm Bet
                </button>
                <button
                  type="button"
                  onClick={() => { setBettingMatch(null); setBetAmount(''); setBetPick(null); }}
                  className="flex-1 border border-[#333] text-white font-bold tracking-widest uppercase p-4 hover:bg-[#111] transition-colors text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DialogComponent />`
content = content.replace(endRegex, bettingModalStr)

fs.writeFileSync(path, content, 'utf8')
console.log('Successfully patched player-portal/page.tsx')
