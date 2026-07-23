const fs = require('fs')

const path = 'app/franchise-portal/page.tsx'
let content = fs.readFileSync(path, 'utf8')

// Find the end of the Active Matches section
const activeMatchesEndRegex = /\{\s*challenges\.filter\(c => c\.status === 'accepted'\)\.length === 0 && \([\s\S]*?<\/p>\s*\)\s*\}\s*<\/div>\s*<\/div>/
const match = content.match(activeMatchesEndRegex)

if (match) {
  const insertionIndex = match.index + match[0].length

  const historyHtml = `
            {/* Wager History */}
            <div>
              <h3 className="text-white font-bold tracking-widest uppercase text-sm mb-4 border-t border-[#1a1a1a] pt-8">Wager History</h3>
              <div className="space-y-4">
                {challenges.filter(c => c.status === 'completed').map(challenge => {
                  const isChallenger = challenge.challenger_id === franchise?.id
                  const opponent = isChallenger ? challenge.challenged : challenge.challenger
                  const isWinner = challenge.winner_id === franchise?.id
                  const isDraw = challenge.winner_id === null

                  const totalPot = challenge.wager_amount * 2
                  
                  return (
                    <div key={challenge.id} className="border border-[#222] bg-black p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-4">
                        {opponent.logo_url && <img src={opponent.logo_url} alt="Logo" className="w-10 h-10 object-contain" />}
                        <div>
                          <p className="text-white text-xs font-bold uppercase">VS {opponent.name}</p>
                          <p className="text-[#555] font-mono text-[10px]">Wager: {challenge.wager_amount.toLocaleString()} CR</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {isDraw ? (
                          <>
                            <p className="text-[#888] font-bold uppercase tracking-widest text-sm">Draw</p>
                            <p className="text-[#555] text-[10px]">Refunded</p>
                          </>
                        ) : isWinner ? (
                          <>
                            <p className="text-green-500 font-bold uppercase tracking-widest text-sm">Win</p>
                            <p className="text-green-500 font-mono text-xs">+{Math.floor(totalPot / 2).toLocaleString()} CR (Franchise Share)</p>
                          </>
                        ) : (
                          <>
                            <p className="text-red-500 font-bold uppercase tracking-widest text-sm">Loss</p>
                            <p className="text-red-500 font-mono text-xs">-{challenge.wager_amount.toLocaleString()} CR</p>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
                {challenges.filter(c => c.status === 'completed').length === 0 && (
                  <p className="text-[#555] text-xs uppercase tracking-widest">No completed wagers</p>
                )}
              </div>
            </div>`

  content = content.slice(0, insertionIndex) + historyHtml + content.slice(insertionIndex)
  fs.writeFileSync(path, content, 'utf8')
  console.log('Successfully patched franchise-portal/page.tsx with history')
} else {
  console.error('Failed to find insertion point for wager history')
}
