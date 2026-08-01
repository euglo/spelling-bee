import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { GameState, RoundId, RoundState, ScoreDelta } from '../types/game'
import { cellKey } from '../types/game'

// v2: resolutions record a list of signed score deltas instead of a single
// wonBy/points pair, since Round 2 can move two teams on one cell. There is no
// migration — bumping the key drops stale v1 games rather than crashing on them.
const STORAGE_KEY = 'spelling-bee-game-state-v2'

function emptyRoundState(): RoundState {
  return { cells: {}, currentPickerTeamId: null, rotationIndex: 0, lastResolvedKey: null }
}

function loadInitialState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as GameState
  } catch {
    // corrupted storage, fall through to a fresh game
  }
  return { teams: [], round1: emptyRoundState(), round2: emptyRoundState() }
}

interface GameStateContextValue {
  state: GameState
  addTeam: (name: string) => void
  removeTeam: (id: string) => void
  renameTeam: (id: string, name: string) => void
  selectCell: (round: RoundId, categoryIndex: number, cellIndex: number) => void
  cancelCell: (round: RoundId, categoryIndex: number, cellIndex: number) => void
  resolveCell: (round: RoundId, categoryIndex: number, cellIndex: number, resolution: ResolveInput) => void
  undoLastResolved: (round: RoundId) => void
  resetGame: () => void
}

interface ResolveInput {
  /** every score change this cell caused; may touch two teams */
  deltas: ScoreDelta[]
  /** team that netted positive, for display and for who picks next */
  winningTeamId: string | null
  attemptedBy: string | null
  attemptOutcomeId: string
  stealBy?: string | null
  stealOutcomeId?: string
  /** Daily Double: the selector keeps board control regardless of outcome */
  daily?: boolean
  wager?: number
}

const GameStateContext = createContext<GameStateContextValue | null>(null)

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(loadInitialState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const addTeam = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setState((prev) => ({
      ...prev,
      teams: [...prev.teams, { id: crypto.randomUUID(), name: trimmed, score: 0 }],
    }))
  }

  const removeTeam = (id: string) => {
    setState((prev) => ({ ...prev, teams: prev.teams.filter((t) => t.id !== id) }))
  }

  const renameTeam = (id: string, name: string) => {
    setState((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => (t.id === id ? { ...t, name } : t)),
    }))
  }

  const selectCell = (round: RoundId, categoryIndex: number, cellIndex: number) => {
    setState((prev) => {
      const key = cellKey(categoryIndex, cellIndex)
      const roundState = prev[round]
      if (roundState.cells[key]) return prev
      return {
        ...prev,
        [round]: {
          ...roundState,
          cells: { ...roundState.cells, [key]: { status: 'in-play' } },
        },
      }
    })
  }

  const cancelCell = (round: RoundId, categoryIndex: number, cellIndex: number) => {
    setState((prev) => {
      const key = cellKey(categoryIndex, cellIndex)
      const roundState = prev[round]
      if (roundState.cells[key]?.status !== 'in-play') return prev
      const { [key]: _removed, ...rest } = roundState.cells
      return { ...prev, [round]: { ...roundState, cells: rest } }
    })
  }

  const resolveCell = (round: RoundId, categoryIndex: number, cellIndex: number, resolution: ResolveInput) => {
    const { deltas, winningTeamId, attemptedBy, attemptOutcomeId, stealBy, stealOutcomeId, daily, wager } =
      resolution
    setState((prev) => {
      const key = cellKey(categoryIndex, cellIndex)
      const roundState = prev[round]
      const teams = prev.teams.map((t) => {
        const delta = deltas.find((d) => d.teamId === t.id)
        return delta ? { ...t, score: t.score + delta.points } : t
      })

      // Whoever netted positive earns the board. On a Daily Double the selector
      // keeps control either way (real Jeopardy). Otherwise the turn rotates.
      const keepsControl = winningTeamId ?? (daily ? attemptedBy : null)

      const nextRotationIndex = keepsControl
        ? roundState.rotationIndex
        : (roundState.rotationIndex + 1) % Math.max(prev.teams.length, 1)

      const nextPicker = keepsControl
        ? keepsControl
        : prev.teams.length > 0
          ? prev.teams[nextRotationIndex].id
          : null

      return {
        ...prev,
        teams,
        [round]: {
          ...roundState,
          cells: {
            ...roundState.cells,
            [key]: {
              status: 'resolved',
              wonBy: winningTeamId,
              deltas,
              attemptedBy,
              attemptOutcomeId,
              stealBy,
              stealOutcomeId,
              wager,
              prevPickerTeamId: roundState.currentPickerTeamId,
              prevRotationIndex: roundState.rotationIndex,
            },
          },
          currentPickerTeamId: nextPicker,
          rotationIndex: nextRotationIndex,
          lastResolvedKey: key,
        },
      }
    })
  }

  const undoLastResolved = (round: RoundId) => {
    setState((prev) => {
      const roundState = prev[round]
      const key = roundState.lastResolvedKey
      if (!key) return prev
      const resolution = roundState.cells[key]
      if (!resolution || resolution.status !== 'resolved') return prev

      const { [key]: _removed, ...restCells } = roundState.cells
      const deltas = resolution.deltas ?? []
      const teams = prev.teams.map((t) => {
        const delta = deltas.find((d) => d.teamId === t.id)
        return delta ? { ...t, score: t.score - delta.points } : t
      })

      return {
        ...prev,
        teams,
        [round]: {
          ...roundState,
          cells: restCells,
          currentPickerTeamId: resolution.prevPickerTeamId ?? null,
          rotationIndex: resolution.prevRotationIndex ?? 0,
          lastResolvedKey: null,
        },
      }
    })
  }

  const resetGame = () => {
    setState({ teams: [], round1: emptyRoundState(), round2: emptyRoundState() })
  }

  return (
    <GameStateContext.Provider
      value={{
        state,
        addTeam,
        removeTeam,
        renameTeam,
        selectCell,
        cancelCell,
        resolveCell,
        undoLastResolved,
        resetGame,
      }}
    >
      {children}
    </GameStateContext.Provider>
  )
}

export function useGameState() {
  const ctx = useContext(GameStateContext)
  if (!ctx) throw new Error('useGameState must be used within GameStateProvider')
  return ctx
}
