const fs = require('fs')

const path = 'app/franchise-portal/page.tsx'
let content = fs.readFileSync(path, 'utf8')

// 1. Add Challenge interface and update Tab type
const tabRegex = /type Tab = 'roster' \| 'market' \| 'bids'/
const interfaceStr = `interface Challenge {
  id: string
  challenger_id: string
  challenged_id: string
  wager_amount: number
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'canceled'
  winner_id: string | null
  created_at: string
  challenger: Franchise
  challenged: Franchise
}

type Tab = 'roster' | 'market' | 'bids' | 'challenges'`

content = content.replace(tabRegex, interfaceStr)

// 2. Add challenges state
const stateRegex = /const \[incomingBids, setIncomingBids\] = useState<Bid\[\]>\(\[\]\)/
content = content.replace(stateRegex, `const [incomingBids, setIncomingBids] = useState<Bid[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])`)

// 3. Update Promise.all in fetchPortalData
const fetchRegex = /fetch\('\/api\/franchise\/offer'\)\n\s+\]\)/
content = content.replace(fetchRegex, `fetch('/api/franchise/offer'),
        fetch('/api/franchise/challenges')
      ])`)

const meResRegex = /const \[meRes, playersRes, bidsRes, offersRes\] = await Promise\.all/
content = content.replace(meResRegex, `const [meRes, playersRes, bidsRes, offersRes, challengesRes] = await Promise.all`)

// 4. Extract data in fetchPortalData
const jsonRegex = /const offersData = await offersRes\.json\(\)/
content = content.replace(jsonRegex, `const offersData = await offersRes.json()\n      const challengesData = await challengesRes.json()`)

// 5. Set data in fetchPortalData
const setRegex = /setContractOffers\(offersData\.offers \|\| \[\]\)/
content = content.replace(setRegex, `setContractOffers(offersData.offers || [])\n      setChallenges(challengesData.challenges || [])`)

// 6. Add handleRespondChallenge function
const handleRespondBidRegex = /const handleRespondPendingBid = async \(bidId: string, action: 'accept' \| 'reject' \| 'counter'\) => \{/
const handleRespondChallengeStr = `const handleRespondChallenge = async (challengeId: string, action: 'accept' | 'reject' | 'cancel') => {
    let confirmMsg = \`Are you sure you want to \${action} this wager?\`
    if (action === 'accept') confirmMsg += ' The wager amount will be deducted from your budget.'
    
    const confirmed = await showDialog({ type: 'confirm', message: confirmMsg })
    if (!confirmed) return

    setActioning(challengeId)
    try {
      const res = await fetch('/api/franchise/challenges/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: challengeId, action })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to respond to wager')
      }

      await showDialog({ type: 'alert', message: \`Wager \${action}ed successfully!\` })
      await fetchPortalData()
    } catch (err: any) {
      await showDialog({ type: 'alert', message: err.message })
    } finally {
      setActioning(null)
    }
  }

  const handleRespondPendingBid = async (bidId: string, action: 'accept' | 'reject' | 'counter') => {`
content = content.replace(handleRespondBidRegex, handleRespondChallengeStr)

// 7. Update Tabs HTML
const tabsHtmlRegex = /<button\s+onClick=\{\(\) => setTab\('bids'\)\}[\s\S]*?<\/button>/
const newTabsHtml = `<button
          onClick={() => setTab('bids')}
          className={\`flex-1 py-4 text-[10px] font-bold tracking-widest uppercase transition-colors
            \${tab === 'bids' ? 'text-white border-b-2 border-white bg-[#050505]' : 'text-[#555]'}\`}
        >
          Bids ({outgoingBids.length + incomingBids.length})
        </button>
        <button
          onClick={() => setTab('challenges')}
          className={\`flex-1 py-4 text-[10px] font-bold tracking-widest uppercase transition-colors
            \${tab === 'challenges' ? 'text-white border-b-2 border-white bg-[#050505]' : 'text-[#555]'}\`}
        >
          Wagers ({challenges.length})
        </button>`
content = content.replace(tabsHtmlRegex, newTabsHtml)

// 8. Render Challenges content before modal
const contentEndRegex = /\{\/\* Bid Modal Overlay \*\/\}/
const challengesRenderStr = `{tab === 'challenges' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-white font-bold tracking-widest uppercase text-sm mb-4">Pending Wagers</h3>
              <div className="space-y-4">
                {challenges.filter(c => c.status === 'pending').map(challenge => {
                  const isIncoming = challenge.challenged_id === franchise?.id
                  const opponent = isIncoming ? challenge.challenger : challenge.challenged
                  
                  return (
                    <div key={challenge.id} className="border border-[#222] bg-black p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-4">
                        {opponent.logo_url && <img src={opponent.logo_url} alt="Logo" className="w-10 h-10 object-contain" />}
                        <div>
                          <p className="text-white text-xs font-bold uppercase">{isIncoming ? 'Received from' : 'Sent to'}: {opponent.name}</p>
                          <p className="text-amber-500 font-mono text-sm font-bold">{challenge.wager_amount.toLocaleString()} CR</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isIncoming ? (
                          <>
                            <button
                              disabled={actioning !== null}
                              onClick={() => handleRespondChallenge(challenge.id, 'accept')}
                              className="px-6 py-2 bg-white text-black font-bold uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                              Accept
                            </button>
                            <button
                              disabled={actioning !== null}
                              onClick={() => handleRespondChallenge(challenge.id, 'reject')}
                              className="px-6 py-2 border border-[#333] text-white font-bold uppercase tracking-widest text-[10px] hover:bg-[#111] transition-colors disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            disabled={actioning !== null}
                            onClick={() => handleRespondChallenge(challenge.id, 'cancel')}
                            className="px-6 py-2 border border-[#333] text-white font-bold uppercase tracking-widest text-[10px] hover:bg-[#111] transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
                {challenges.filter(c => c.status === 'pending').length === 0 && (
                  <p className="text-[#555] text-xs uppercase tracking-widest">No pending wagers</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-white font-bold tracking-widest uppercase text-sm mb-4 border-t border-[#1a1a1a] pt-8">Active Matches</h3>
              <div className="space-y-4">
                {challenges.filter(c => c.status === 'accepted').map(challenge => {
                  const isChallenger = challenge.challenger_id === franchise?.id
                  const opponent = isChallenger ? challenge.challenged : challenge.challenger
                  return (
                    <div key={challenge.id} className="border border-[#222] bg-[#050505] p-6 text-center">
                      <div className="flex justify-center items-center gap-8 mb-4">
                        <div className="text-center">
                          {franchise?.logo_url && <img src={franchise.logo_url} alt="You" className="w-12 h-12 mx-auto mb-2 object-contain" />}
                          <p className="text-[10px] text-white font-bold uppercase">{franchise?.name}</p>
                        </div>
                        <div className="text-amber-500 font-bold italic tracking-widest uppercase text-sm">VS</div>
                        <div className="text-center">
                          {opponent.logo_url && <img src={opponent.logo_url} alt="Opponent" className="w-12 h-12 mx-auto mb-2 object-contain" />}
                          <p className="text-[10px] text-[#555] font-bold uppercase">{opponent.name}</p>
                        </div>
                      </div>
                      <div className="inline-block border border-amber-500/30 bg-amber-500/10 px-4 py-2">
                        <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-1">Total Pot</p>
                        <p className="text-white font-mono text-lg font-bold">{(challenge.wager_amount * 2).toLocaleString()} CR</p>
                      </div>
                      <p className="text-[#555] text-[10px] uppercase tracking-widest mt-4">Waiting for Admin to resolve match</p>
                    </div>
                  )
                })}
                {challenges.filter(c => c.status === 'accepted').length === 0 && (
                  <p className="text-[#555] text-xs uppercase tracking-widest">No active wagers</p>
                )}
              </div>
            </div>
          </div>
        )}

      {/* Bid Modal Overlay */}`
content = content.replace(contentEndRegex, challengesRenderStr)

fs.writeFileSync(path, content, 'utf8')
console.log('Successfully patched franchise-portal/page.tsx')
