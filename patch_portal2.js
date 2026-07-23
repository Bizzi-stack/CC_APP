const fs = require('fs')

const path = 'app/franchise-portal/page.tsx'
let content = fs.readFileSync(path, 'utf8')

// 1. Add allFranchises state
const stateRegex = /const \[challenges, setChallenges\] = useState<Challenge\[\]>\(\[\]\)/
content = content.replace(stateRegex, `const [challenges, setChallenges] = useState<Challenge[]>([])
  const [allFranchises, setAllFranchises] = useState<Franchise[]>([])
  
  // Challenge Modal State
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false)
  const [challengeOpponentId, setChallengeOpponentId] = useState('')
  const [challengeWager, setChallengeWager] = useState('')`)

// 2. Fetch all franchises in fetchPortalData
const fetchPromiseRegex = /fetch\('\/api\/franchise\/challenges'\)\n\s+\]\)/
content = content.replace(fetchPromiseRegex, `fetch('/api/franchise/challenges'),
        fetch('/api/franchises')
      ])`)

const meResRegex = /const \[meRes, playersRes, bidsRes, offersRes, challengesRes\] = await Promise\.all/
content = content.replace(meResRegex, `const [meRes, playersRes, bidsRes, offersRes, challengesRes, franchisesRes] = await Promise.all`)

const jsonRegex = /const challengesData = await challengesRes\.json\(\)/
content = content.replace(jsonRegex, `const challengesData = await challengesRes.json()\n      const franchisesData = await franchisesRes?.json() || { franchises: [] }`)

const setRegex = /setChallenges\(challengesData\.challenges \|\| \[\]\)/
content = content.replace(setRegex, `setChallenges(challengesData.challenges || [])\n      setAllFranchises(franchisesData.franchises || [])`)

// 3. Add handleCreateChallenge
const handleFuncRegex = /const handleRespondChallenge = async/
const createFuncStr = `const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!challengeOpponentId) return await showDialog({ type: 'alert', message: 'Please select an opponent' })
    const wager = parseInt(challengeWager)
    if (isNaN(wager) || wager < 0) return await showDialog({ type: 'alert', message: 'Invalid wager amount' })
    if (franchise && franchise.budget < wager) return await showDialog({ type: 'alert', message: 'Insufficient budget' })

    setActioning('create-challenge')
    try {
      const res = await fetch('/api/franchise/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenged_id: challengeOpponentId, wager_amount: wager })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send challenge')

      await showDialog({ type: 'alert', message: 'Challenge sent successfully!' })
      setIsChallengeModalOpen(false)
      setChallengeOpponentId('')
      setChallengeWager('')
      await fetchPortalData()
    } catch (err: any) {
      await showDialog({ type: 'alert', message: err.message })
    } finally {
      setActioning(null)
    }
  }

  const handleRespondChallenge = async`
content = content.replace(handleFuncRegex, createFuncStr)

// 4. Add "Send Challenge" button
const titleRegex = /<h3 className="text-white font-bold tracking-widest uppercase text-sm mb-4">Pending Wagers<\/h3>/
const newTitleStr = `<div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-bold tracking-widest uppercase text-sm">Pending Wagers</h3>
                <button
                  onClick={() => setIsChallengeModalOpen(true)}
                  className="bg-amber-500 text-black px-4 py-2 text-[10px] font-bold tracking-widest uppercase hover:bg-amber-400 transition-colors"
                >
                  New Challenge
                </button>
              </div>`
content = content.replace(titleRegex, newTitleStr)

// 5. Add Modal UI before Bid Modal Overlay
const modalRegex = /\{\/\* Bid Modal Overlay \*\/\}/
const challengeModalStr = `{/* Challenge Modal */}
      {isChallengeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-[#222] p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold uppercase tracking-wide mb-2 text-white">Challenge Franchise</h2>
            <p className="text-xs text-[#666] mb-6">
              Select an opponent and set a wager. If accepted, the wager will be held until the match is resolved.
            </p>

            <form onSubmit={handleCreateChallenge} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-[#555]">
                  Opponent
                </label>
                <select
                  required
                  value={challengeOpponentId}
                  onChange={e => setChallengeOpponentId(e.target.value)}
                  className="w-full bg-[#111] border border-[#333] p-4 text-white focus:outline-none focus:border-white transition-colors text-sm font-bold uppercase"
                >
                  <option value="">Select Franchise</option>
                  {allFranchises.filter(f => f.id !== franchise?.id).map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-[#555]">
                  Wager Amount (CR)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={franchise?.budget || 0}
                  value={challengeWager}
                  onChange={e => setChallengeWager(e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full bg-[#111] border border-[#333] p-4 text-white focus:outline-none focus:border-white transition-colors text-base font-bold font-mono"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={actioning !== null}
                  className="flex-1 bg-white text-black font-bold tracking-widest uppercase p-4 hover:bg-gray-200 transition-colors disabled:opacity-50 text-xs"
                >
                  Send Challenge
                </button>
                <button
                  type="button"
                  onClick={() => setIsChallengeModalOpen(false)}
                  className="flex-1 border border-[#333] text-white font-bold tracking-widest uppercase p-4 hover:bg-[#111] transition-colors text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bid Modal Overlay */}`
content = content.replace(modalRegex, challengeModalStr)

fs.writeFileSync(path, content, 'utf8')
console.log('Successfully patched franchise-portal/page.tsx again')
