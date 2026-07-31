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
}

export type RoundId = 'round1' | 'round2'

export interface RoundState {
  cells: Record<string, CellResolution>
  currentPickerTeamId: string | null
  rotationIndex: number
}

export interface GameState {
  teams: Team[]
  round1: RoundState
  round2: RoundState
}

export function cellKey(categoryIndex: number, cellIndex: number): string {
  return `${categoryIndex}-${cellIndex}`
}
