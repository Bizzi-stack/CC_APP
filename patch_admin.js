const fs = require('fs')
const path = 'app/admin-stats/page.tsx'
let content = fs.readFileSync(path, 'utf8')

// 1. Add challenges state
const stateRegex = /const \[players, setPlayers\] = useState<any\[\]>\(\[\]\)/
content = content.replace(stateRegex, `const [players, setPlayers] = useState<any[]>([])
  const [challenges, setChallenges] = useState<any[]>([])`)

// 2. Add fetch for challenges
const fetchRegex = /fetch\('\/api\/players'\)\n\s+\]\)/
content = content.replace(fetchRegex, `fetch('/api/players'),
        fetch('/api/admin/challenges/resolve')
      ])`)

const fResRegex = /const \[fRes, pRes\] = await Promise\.all/
content = content.replace(fResRegex, `const [fRes, pRes, cRes] = await Promise.all`)

const jsonRegex = /const pData = await pRes\.json\(\)/
content = content.replace(jsonRegex, `const pData = await pRes.json()
      const cData = await cRes.json()`)

const setRegex = /setPlayers\(pData\.players \|\| \[\]\)/
content = content.replace(setRegex, `setPlayers(pData.players || [])
      setChallenges(cData.challenges || [])`)

// 3. Add handleResolveChallenge
const handleFuncRegex = /const handleUpdatePlayer = async/
const resolveFuncStr = `const handleResolveChallenge = async (challengeId: string, winnerId: string | null) => {
    const confirmMsg = winnerId ? 'Declare this franchise as the winner and payout the pot?' : 'Declare this match a draw and refund both franchises?'
    if (!confirm(confirmMsg)) return

    setUpdatingId(challengeId)
    try {
      const res = await fetch('/api/admin/challenges/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: challengeId, winner_id: winnerId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to resolve')
      alert('Match resolved successfully!')
      fetchData()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  const handleUpdatePlayer = async`
content = content.replace(handleFuncRegex, resolveFuncStr)

// 4. Add UI section for challenges at the top of the return statement
const sectionRegex = /<section className="mb-16">/
const challengesSectionStr = `<section className="mb-16">
        <h2 className="text-amber-500 font-bold uppercase tracking-widest mb-6">Active Wager Matches</h2>
        <div className="space-y-4">
          {challenges.filter(c => c.status === 'accepted').length === 0 ? (
            <p className="text-[#555] text-sm">No active wager matches waiting for resolution.</p>
          ) : (
            challenges.filter(c => c.status === 'accepted').map(c => (
              <div key={c.id} className="border border-[#333] p-6 bg-[#050505]">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-center flex-1">
                    <p className="font-bold text-white mb-2">{c.challenger.name}</p>
                    <button 
                      disabled={updatingId === c.id}
                      onClick={() => handleResolveChallenge(c.id, c.challenger_id)}
                      className="bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-gray-200"
                    >
                      Winner
                    </button>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-amber-500 font-bold uppercase tracking-widest text-sm mb-1">VS</p>
                    <p className="text-[#555] font-mono font-bold text-xs">POT: {(c.wager_amount * 2).toLocaleString()} CR</p>
                    <button 
                      disabled={updatingId === c.id}
                      onClick={() => handleResolveChallenge(c.id, null)}
                      className="mt-4 border border-[#333] text-white px-4 py-1 text-[10px] font-bold uppercase tracking-widest hover:bg-[#111]"
                    >
                      Draw (Refund)
                    </button>
                  </div>
                  <div className="text-center flex-1">
                    <p className="font-bold text-white mb-2">{c.challenged.name}</p>
                    <button 
                      disabled={updatingId === c.id}
                      onClick={() => handleResolveChallenge(c.id, c.challenged_id)}
                      className="bg-white text-black px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-gray-200"
                    >
                      Winner
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mb-16">`
content = content.replace(sectionRegex, challengesSectionStr)

fs.writeFileSync(path, content, 'utf8')
console.log('Successfully patched admin-stats/page.tsx')
