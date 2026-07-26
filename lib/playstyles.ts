export interface PlayStyleDef {
  id: string
  name: string
  category: 'Scoring' | 'Passing' | 'Ball Control' | 'Defending' | 'Physical' | 'Goalkeeping'
  description: string
  iconSvg: string
  bgGradient: string
  borderColor: string
  textColor: string
  legacyAliases: string[]
}

export const PLAYSTYLES_LIST: PlayStyleDef[] = [
  {
    id: 'finesse_shot',
    name: 'Finesse Shot',
    category: 'Scoring',
    description: 'Executes finesse shots with maximum accuracy, curve, and signature lethal curling placement.',
    iconSvg: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-4a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    bgGradient: 'from-amber-500/20 via-yellow-600/15 to-amber-900/30',
    borderColor: 'border-amber-400/50',
    textColor: 'text-amber-300',
    legacyAliases: ['scorer', 'finesse shot', 'finesse', 'sniper', 'finisher']
  },
  {
    id: 'power_shot',
    name: 'Power Shot',
    category: 'Scoring',
    description: 'Executes long-range cannon strikes faster and with devastating shot power.',
    iconSvg: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    bgGradient: 'from-orange-500/20 via-red-600/15 to-orange-950/30',
    borderColor: 'border-orange-500/50',
    textColor: 'text-orange-400',
    legacyAliases: ['power shot', 'cannon', 'long shooter', 'bomb']
  },
  {
    id: 'incisive_pass',
    name: 'Incisive Pass',
    category: 'Passing',
    description: 'Through passes travel with higher speed and pinpoint accuracy through compact defenses.',
    iconSvg: 'M5 12h14M12 5l7 7-7 7',
    bgGradient: 'from-cyan-500/20 via-teal-600/15 to-cyan-950/30',
    borderColor: 'border-cyan-400/50',
    textColor: 'text-cyan-300',
    legacyAliases: ['playmaker', 'incisive pass', 'passer', 'vision', 'maestro']
  },
  {
    id: 'tiki_taka',
    name: 'Tiki Taka',
    category: 'Passing',
    description: 'Executes rapid first-time grounded passes with supreme precision under high pressure.',
    iconSvg: 'M12 2L2 7l10 5 10-5-10-5zm0 9L2 16l10 5 10-5-10-5z',
    bgGradient: 'from-emerald-500/20 via-green-600/15 to-emerald-950/30',
    borderColor: 'border-emerald-400/50',
    textColor: 'text-emerald-300',
    legacyAliases: ['tiki taka', 'short pass', 'conductor']
  },
  {
    id: 'rapid',
    name: 'Rapid Pace',
    category: 'Physical',
    description: 'Reaches explosive top sprint speeds while carrying the ball forward in transition.',
    iconSvg: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    bgGradient: 'from-sky-500/20 via-blue-600/15 to-blue-950/30',
    borderColor: 'border-sky-400/50',
    textColor: 'text-sky-300',
    legacyAliases: ['speedster', 'rapid', 'pace', 'sprinter', 'lightning', 'fast']
  },
  {
    id: 'technical',
    name: 'Technical Dribbler',
    category: 'Ball Control',
    description: 'Maintains supreme ball control and agility during Controlled Sprints and tight turns.',
    iconSvg: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    bgGradient: 'from-purple-500/20 via-fuchsia-600/15 to-purple-950/30',
    borderColor: 'border-purple-400/50',
    textColor: 'text-purple-300',
    legacyAliases: ['technical', 'dribbler', 'star', 'skiller', 'trickster', 'creator']
  },
  {
    id: 'block_wall',
    name: 'Block Wall',
    category: 'Defending',
    description: 'Dominates defensive blocking reach with elite positioning and stoppage rate.',
    iconSvg: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    bgGradient: 'from-slate-400/20 via-blue-900/20 to-slate-950/40',
    borderColor: 'border-slate-400/50',
    textColor: 'text-slate-200',
    legacyAliases: ['wall', 'block', 'defender', 'fortress', 'rock']
  },
  {
    id: 'anticipate',
    name: 'Anticipate Tackle',
    category: 'Defending',
    description: 'High success rate on standing tackles, winning the ball directly back into control.',
    iconSvg: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
    bgGradient: 'from-teal-500/20 via-emerald-700/15 to-teal-950/30',
    borderColor: 'border-teal-400/50',
    textColor: 'text-teal-300',
    legacyAliases: ['anticipate', 'interceptor', 'tackler', 'stopper']
  },
  {
    id: 'cat_reflexes',
    name: 'Cat Reflexes',
    category: 'Goalkeeping',
    description: 'Cat-like agility and instant reflexes when saving close-range shots inside the box.',
    iconSvg: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z',
    bgGradient: 'from-amber-400/20 via-emerald-600/15 to-amber-950/30',
    borderColor: 'border-amber-400/60',
    textColor: 'text-amber-200',
    legacyAliases: ['cat', 'reflexes', 'shot stopper', 'gk', 'goalkeeper']
  },
  {
    id: 'aerial',
    name: 'Aerial Specialist',
    category: 'Physical',
    description: 'Performs higher vertical jumps with elite aerial physical dominance and heading prowess.',
    iconSvg: 'M12 19V5M5 12l7-7 7 7',
    bgGradient: 'from-indigo-500/20 via-blue-600/15 to-indigo-950/30',
    borderColor: 'border-indigo-400/50',
    textColor: 'text-indigo-300',
    legacyAliases: ['aerial', 'air specialist', 'header', 'jumper']
  },
  {
    id: 'relentless',
    name: 'Relentless Engine',
    category: 'Physical',
    description: 'Recovers stamina rapidly at halftime and maintains maximum work rate all match long.',
    iconSvg: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
    bgGradient: 'from-rose-500/20 via-red-600/15 to-rose-950/30',
    borderColor: 'border-rose-400/50',
    textColor: 'text-rose-300',
    legacyAliases: ['relentless', 'engine', 'stamina', 'workhorse']
  }
]

export function getPlayStyle(idOrName?: string | null): PlayStyleDef | null {
  if (!idOrName) return null
  const clean = idOrName.trim().toLowerCase()
  return (
    PLAYSTYLES_LIST.find(
      p =>
        p.id.toLowerCase() === clean ||
        p.name.toLowerCase() === clean ||
        p.legacyAliases.some(alias => alias.toLowerCase() === clean)
    ) || null
  )
}
