const fs = require('fs')

const path = 'app/player-portal/page.tsx'
let content = fs.readFileSync(path, 'utf8')

// If the sportsbook section isn't there, we inject it right before {/* Badge Shop / Marketplace */}
if (!content.includes('Sportsbook <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full">BETA</span>')) {
  const insertRegex = /\{\/\* Badge Shop \/ Marketplace \*\/\}/

  const sportsbookSection = `
        {/* Sportsbook */}
        {!isBusiness && (
          <div className="bg-[#0a0a0a] border border-[#222] p-6 col-span-full md:col-span-1 lg:col-span-2 relative mb-6">
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

        {/* Badge Shop / Marketplace */}`

  content = content.replace(insertRegex, sportsbookSection)
  fs.writeFileSync(path, content, 'utf8')
  console.log('Successfully injected Sportsbook UI')
} else {
  console.log('Sportsbook already injected!')
}
