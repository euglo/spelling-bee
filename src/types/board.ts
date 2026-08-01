export interface BoardCategory<TCell> {
  name: string
  cells: TCell[]
}

export interface Board<TCell> {
  categories: BoardCategory<TCell>[]
}

export interface Round1Cell {
  points: number
  word: string
  hint?: string
}

/** Anything beyond plain clue text. Omit `media` entirely for a text-only clue. */
export type CellMedia =
  /** rendered inline above the clue */
  | { type: 'image'; src: string; caption?: string }
  /** shown on another screen — the host switches tabs/devices */
  | { type: 'external'; label?: string }

export interface Round2Cell {
  points: number
  clue: string
  answer: string
  /** Daily Double: wager replaces the face value. Hidden from players until picked. */
  daily?: boolean
  media?: CellMedia
}

export type Round1Board = Board<Round1Cell>
export type Round2Board = Board<Round2Cell>
