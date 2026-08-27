export interface FantasyGameweek {
  id: number
  name: string
  status: 'upcoming' | 'active' | 'completed'
  deadline?: string | null
}

export interface FantasySlot {
  slotId: string
  label: string
  positionType: 'GK' | 'DEF' | 'MID' | 'FWD' | 'FLEX'
  isStarter: boolean
}

export type FormationType = '2-2-2' | '3-2-1' | '2-3-1'

export function getSlotsForFormation(formation: string = '2-2-2'): FantasySlot[] {
  if (formation === '3-2-1') {
    return [
      { slotId: 'GK', label: 'Goalkeeper', positionType: 'GK', isStarter: true },
      { slotId: 'DEF1', label: 'Defender 1', positionType: 'DEF', isStarter: true },
      { slotId: 'DEF2', label: 'Defender 2', positionType: 'DEF', isStarter: true },
      { slotId: 'DEF3', label: 'Defender 3', positionType: 'DEF', isStarter: true },
      { slotId: 'MID1', label: 'Midfielder 1', positionType: 'MID', isStarter: true },
      { slotId: 'MID2', label: 'Midfielder 2', positionType: 'MID', isStarter: true },
      { slotId: 'FWD1', label: 'Forward 1', positionType: 'FWD', isStarter: true },
      { slotId: 'SUB1', label: 'Substitute 1', positionType: 'FLEX', isStarter: false },
      { slotId: 'SUB2', label: 'Substitute 2', positionType: 'FLEX', isStarter: false },
    ]
  }

  if (formation === '2-3-1') {
    return [
      { slotId: 'GK', label: 'Goalkeeper', positionType: 'GK', isStarter: true },
      { slotId: 'DEF1', label: 'Defender 1', positionType: 'DEF', isStarter: true },
      { slotId: 'DEF2', label: 'Defender 2', positionType: 'DEF', isStarter: true },
      { slotId: 'MID1', label: 'Midfielder 1', positionType: 'MID', isStarter: true },
      { slotId: 'MID2', label: 'Midfielder 2', positionType: 'MID', isStarter: true },
      { slotId: 'MID3', label: 'Midfielder 3', positionType: 'MID', isStarter: true },
      { slotId: 'FWD1', label: 'Forward 1', positionType: 'FWD', isStarter: true },
      { slotId: 'SUB1', label: 'Substitute 1', positionType: 'FLEX', isStarter: false },
      { slotId: 'SUB2', label: 'Substitute 2', positionType: 'FLEX', isStarter: false },
    ]
  }

  // Default: 2-2-2
  return [
    { slotId: 'GK', label: 'Goalkeeper', positionType: 'GK', isStarter: true },
    { slotId: 'DEF1', label: 'Defender 1', positionType: 'DEF', isStarter: true },
    { slotId: 'DEF2', label: 'Defender 2', positionType: 'DEF', isStarter: true },
    { slotId: 'MID1', label: 'Midfielder 1', positionType: 'MID', isStarter: true },
    { slotId: 'MID2', label: 'Midfielder 2', positionType: 'MID', isStarter: true },
    { slotId: 'FWD1', label: 'Forward 1', positionType: 'FWD', isStarter: true },
    { slotId: 'FWD2', label: 'Forward 2', positionType: 'FWD', isStarter: true },
    { slotId: 'SUB1', label: 'Substitute 1', positionType: 'FLEX', isStarter: false },
    { slotId: 'SUB2', label: 'Substitute 2', positionType: 'FLEX', isStarter: false },
  ]
}

export const FANTASY_SLOTS: FantasySlot[] = getSlotsForFormation('2-2-2')

export interface PlayerStats {
  goals?: number
  assists?: number
  clean_sheet?: boolean
  minutes_played?: number
  bonus_points?: number
  yellow_cards?: number
  red_cards?: number
}

/**
 * Calculates FPL-style fantasy points for a player given their position and match stats
 */
export function calculatePlayerPoints(position: string | undefined | null, stats: PlayerStats): number {
  const pos = (position || '').toUpperCase()
  const goals = stats.goals || 0
  const assists = stats.assists || 0
  const cleanSheet = stats.clean_sheet || false
  const minutes = stats.minutes_played !== undefined ? stats.minutes_played : (goals > 0 || assists > 0 ? 60 : 0)
  const bonus = stats.bonus_points || 0
  const yellow = stats.yellow_cards || 0
  const red = stats.red_cards || 0

  let pts = 0

  // 1. Appearance (played 45+ mins = 2 pts, 1-44 mins = 1 pt)
  if (minutes > 0) {
    pts += minutes >= 45 ? 2 : 1
  }

  // 2. Goals
  if (pos.includes('GK') || pos.includes('GOAL') || pos.includes('DEF')) {
    pts += goals * 6
  } else if (pos.includes('MID')) {
    pts += goals * 5
  } else {
    // Forward / Attacker / Default
    pts += goals * 4
  }

  // 3. Assists
  pts += assists * 3

  // 4. Clean Sheet (for GK and DEF only)
  if (cleanSheet && (pos.includes('GK') || pos.includes('GOAL') || pos.includes('DEF'))) {
    pts += 4
  }

  // 5. Bonus
  pts += bonus

  // 6. Cards
  pts -= yellow * 1
  pts -= red * 3

  return Math.max(0, pts)
}
