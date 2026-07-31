import type { ReactNode } from 'react'
import { useGameState } from '../state/GameStateContext'
import type { BoardCategory } from '../types/board'
import type { RoundId } from '../types/game'
import { cellKey } from '../types/game'
import { Cell } from './Cell'
import { ResolvePanel } from './ResolvePanel'

interface CellLike {
  points: number
}

interface JeopardyBoardProps<TCell extends CellLike> {
  round: RoundId
  categories: BoardCategory<TCell>[]
  accent: 'honey' | 'violet'
  shape?: 'hex' | 'rect'
  renderPrompt: (cell: TCell) => ReactNode
  renderReveal: (cell: TCell) => ReactNode
}

const HEADER_ACCENT: Record<'honey' | 'violet', string> = {
  honey: 'text-honey',
  violet: 'text-violet',
}

export function JeopardyBoard<TCell extends CellLike>({
  round,
  categories,
  accent,
  shape = 'rect',
  renderPrompt,
  renderReveal,
}: JeopardyBoardProps<TCell>) {
  const { state, selectCell, cancelCell, resolveCell, undoLastResolved } = useGameState()
  const roundState = state[round]
  const maxRows = Math.max(0, ...categories.map((c) => c.cells.length))

  const activeEntry = Object.entries(roundState.cells).find(([, v]) => v.status === 'in-play')
  const activeKey = activeEntry?.[0] ?? null

  let activeCell: TCell | null = null
  let activeCatIdx = -1
  let activeRowIdx = -1
  if (activeKey) {
    const [c, r] = activeKey.split('-').map(Number)
    activeCatIdx = c
    activeRowIdx = r
    activeCell = categories[c]?.cells[r] ?? null
  }

  const closeActiveCell = () => {
    if (activeCatIdx >= 0) cancelCell(round, activeCatIdx, activeRowIdx)
  }

  const pickerTeam = state.teams.find((t) => t.id === roundState.currentPickerTeamId)
  const resolvedEntries = Object.entries(roundState.cells).filter(
    ([, v]) => v.status === 'resolved',
  )

  return (
    <div className="max-w-5xl mx-auto">
      {state.teams.length === 0 && (
        <p className="text-center font-body text-ink/50 mb-3">
          No teams yet — add teams on the Setup tab before playing.
        </p>
      )}

      {pickerTeam && !activeKey && (
        <p className="text-center font-body text-ink/70 mb-3">
          <span className="text-ink font-bold">{pickerTeam.name}</span> picks the next board.
        </p>
      )}

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${categories.length}, minmax(0,1fr))` }}
      >
        {categories.map((cat) => (
          <div
            key={cat.name}
            className={`font-display ${HEADER_ACCENT[accent]} text-center py-1.5 text-base sm:text-lg tracking-widest uppercase flex items-center justify-center border-b-2 border-ink/15`}
          >
            {cat.name}
          </div>
        ))}

        {Array.from({ length: maxRows }).map((_, rowIdx) =>
          categories.map((cat, catIdx) => {
            const cell = cat.cells[rowIdx]
            if (!cell) return <div key={`${catIdx}-${rowIdx}-empty`} />
            const key = cellKey(catIdx, rowIdx)
            const status = roundState.cells[key]?.status ?? 'unplayed'
            return (
              <Cell
                key={key}
                points={cell.points}
                status={status}
                accent={accent}
                shape={shape}
                disabled={Boolean(activeKey)}
                isLastResolved={key === roundState.lastResolvedKey}
                onUndo={() => undoLastResolved(round)}
                onClick={() => selectCell(round, catIdx, rowIdx)}
              />
            )
          }),
        )}
      </div>

      {activeCell && (
        <div
          className="fixed inset-0 bg-ink-deep/95 flex flex-col items-center justify-center p-8 z-50 text-center"
          onClick={closeActiveCell}
        >
          <div
            className={`relative max-w-2xl w-full rounded-2xl border-4 p-8 bg-yellow shadow-2xl ${
              accent === 'honey' ? 'border-honey' : 'border-violet'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeActiveCell}
              aria-label="Close without resolving"
              title="Close without resolving (clicked by accident)"
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-ink/50 hover:text-buzz hover:bg-ink/10 transition-all duration-150 hover:scale-110"
            >
              ✕
            </button>
            <p className="font-body text-2xl sm:text-3xl font-semibold text-ink mb-2 px-4">
              {renderPrompt(activeCell)}
            </p>
            <ResolvePanel
              points={activeCell.points}
              onResolve={(teamId) => {
                if (!activeCell) return
                resolveCell(round, activeCatIdx, activeRowIdx, activeCell.points, teamId)
              }}
            />
          </div>
        </div>
      )}

      {!activeKey && resolvedEntries.length > 0 && (
        <details className="mt-6 font-body text-ink/50 text-sm">
          <summary className="cursor-pointer">Resolved so far</summary>
          <ul className="mt-2 space-y-1 text-left max-w-md mx-auto font-mono text-xs">
            {resolvedEntries.map(([key, v]) => {
              const [c, r] = key.split('-').map(Number)
              const cell = categories[c]?.cells[r]
              if (!cell) return null
              const winner = state.teams.find((t) => t.id === v.wonBy)
              return (
                <li key={key}>
                  {categories[c].name} — ${cell.points}: {renderReveal(cell)} (
                  {winner ? winner.name : 'unanswered'})
                </li>
              )
            })}
          </ul>
        </details>
      )}
    </div>
  )
}
