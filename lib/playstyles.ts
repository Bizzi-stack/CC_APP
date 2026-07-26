export interface PlayStyleDef {
  id: string
  name: string
  imageUrl: string
  category: 'Scoring' | 'Passing' | 'Ball Control' | 'Defending' | 'Physical'
  description: string
  legacyAliases: string[]
}

export const PLAYSTYLES_LIST: PlayStyleDef[] = [
  {
    id: 'gamechanger',
    name: 'Gamechanger',
    imageUrl: '/playstyles/gamechanger.png',
    category: 'Scoring',
    description: 'Clutch goalscoring, match-winning plays, and game-altering moments.',
    legacyAliases: ['gamechanger', 'scorer', 'finesse shot', 'finesse', 'sniper', 'finisher', 'clutch']
  },
  {
    id: 'inventive',
    name: 'Inventive',
    imageUrl: '/playstyles/inventive.png',
    category: 'Passing',
    description: 'Creative passes, unpredictable ball distribution, and vision.',
    legacyAliases: ['inventive', 'playmaker', 'incisive pass', 'passer', 'vision', 'maestro']
  },
  {
    id: 'rapid',
    name: 'Rapid',
    imageUrl: '/playstyles/rapid.png',
    category: 'Physical',
    description: 'Reaches maximum sprint speed quickly when carrying the ball forward in transition.',
    legacyAliases: ['rapid', 'speedster', 'pace', 'sprinter', 'lightning', 'fast']
  },
  {
    id: 'trickster',
    name: 'Trickster',
    imageUrl: '/playstyles/trickster.png',
    category: 'Ball Control',
    description: 'Elite skill moves, flair dribbling, and signature footwork to bypass defenders.',
    legacyAliases: ['trickster', 'dribbler', 'technical', 'star', 'skiller', 'creator', 'flair']
  },
  {
    id: 'tiki_taka',
    name: 'Tiki Taka',
    imageUrl: '/playstyles/tiki%20taka.png',
    category: 'Passing',
    description: 'One-touch short passing mastery and quick triangular team combinations.',
    legacyAliases: ['tiki taka', 'tiki_taka', 'short pass', 'conductor', 'one touch']
  },
  {
    id: 'press_proven',
    name: 'Press Proven',
    imageUrl: '/playstyles/press_proven.png',
    category: 'Ball Control',
    description: 'Shields and retains the ball effectively under heavy defensive opposition press.',
    legacyAliases: ['press proven', 'press_proven', 'composure', 'holding', 'shield']
  },
  {
    id: 'bruiser',
    name: 'Bruiser',
    imageUrl: '/playstyles/bruiser.png',
    category: 'Defending',
    description: 'Physical dominance, immense strength, and aggressive shoulder tackles.',
    legacyAliases: ['bruiser', 'wall', 'block', 'defender', 'fortress', 'rock', 'enforcer']
  },
  {
    id: 'relentless',
    name: 'Relentless',
    imageUrl: '/playstyles/relentless.png',
    category: 'Physical',
    description: 'Non-stop work rate, infinite engine, and rapid stamina recovery.',
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
