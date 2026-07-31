export interface Team {
  id: string
  name: string
  score: number
}

export type CellStatus = 'unplayed' | 'in-play' | 'resolved'

export interface CellResolution {
  status: CellStatus
  /** teamId that won the points, or null if nobody answered correctly */
  wonBy?: string | null
  /** points banked for this cell, needed to reverse an undo */
  points?: number
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
