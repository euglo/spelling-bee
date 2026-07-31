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

export interface Round2Cell {
  points: number
  clue: string
  answer: string
}

export type Round1Board = Board<Round1Cell>
export type Round2Board = Board<Round2Cell>
