export interface Team {
  id: string
  name: string
  score: number
}

export type CellStatus = 'unplayed' | 'in-play' | 'resolved'

/** A signed score change applied to one team. Round 2 can move two teams on a
 *  single cell — the picker loses the clue value and a stealer gains it. */
export interface ScoreDelta {
  teamId: string
  points: number
}

export interface CellResolution {
  status: CellStatus
  /** every score change this cell caused, so undo can reverse all of them */
  deltas?: ScoreDelta[]
  /** team that netted positive — display only (reveal text, resolved log) */
  wonBy?: string | null
  /** teamId that made the first attempt (the picker) */
  attemptedBy?: string | null
  /** outcome id from lib/scoring.ts describing how the attempt went */
  attemptOutcomeId?: string
  /** teamId that attempted a steal, if the first attempt missed */
  stealBy?: string | null
  /** outcome id from lib/scoring.ts describing how the steal went */
  stealOutcomeId?: string
  /** locked-in wager, Daily Double only — replaces the cell's face value */
  wager?: number
  /** turn state snapshotted right before this resolution, so undo can restore it */
  prevPickerTeamId?: string | null
  prevRotationIndex?: number
}

export type RoundId = 'round1' | 'round2'

export interface RoundState {
  cells: Record<string, CellResolution>
  currentPickerTeamId: string | null
  rotationIndex: number
  /** cell key of the most recently resolved cell — the only one eligible for undo */
  lastResolvedKey: string | null
}

export interface GameState {
  teams: Team[]
  round1: RoundState
  round2: RoundState
}

export function cellKey(categoryIndex: number, cellIndex: number): string {
  return `${categoryIndex}-${cellIndex}`
}
