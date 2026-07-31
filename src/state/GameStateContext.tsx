import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { GameState, RoundId, RoundState } from '../types/game'
import { cellKey } from '../types/game'

const STORAGE_KEY = 'spelling-bee-game-state-v1'

function emptyRoundState(): RoundState {
  return { cells: {}, currentPickerTeamId: null, rotationIndex: 0 }
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
  resolveCell: (
    round: RoundId,
    categoryIndex: number,
    cellIndex: number,
    points: number,
    winningTeamId: string | null,
  ) => void
  resetGame: () => void
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

  const resolveCell = (
    round: RoundId,
    categoryIndex: number,
    cellIndex: number,
    points: number,
    winningTeamId: string | null,
  ) => {
    setState((prev) => {
      const key = cellKey(categoryIndex, cellIndex)
      const roundState = prev[round]
      const teams = winningTeamId
        ? prev.teams.map((t) => (t.id === winningTeamId ? { ...t, score: t.score + points } : t))
        : prev.teams

      const nextRotationIndex = winningTeamId
        ? roundState.rotationIndex
        : (roundState.rotationIndex + 1) % Math.max(prev.teams.length, 1)

      const nextPicker = winningTeamId
        ? winningTeamId
        : prev.teams.length > 0
          ? prev.teams[nextRotationIndex].id
          : null

      return {
        ...prev,
        teams,
        [round]: {
          ...roundState,
          cells: { ...roundState.cells, [key]: { status: 'resolved', wonBy: winningTeamId } },
          currentPickerTeamId: nextPicker,
          rotationIndex: nextRotationIndex,
        },
      }
    })
  }

  const resetGame = () => {
    setState({ teams: [], round1: emptyRoundState(), round2: emptyRoundState() })
  }

  return (
    <GameStateContext.Provider
      value={{ state, addTeam, removeTeam, renameTeam, selectCell, resolveCell, resetGame }}
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
