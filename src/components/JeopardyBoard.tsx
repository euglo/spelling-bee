import { useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameState } from '../state/GameStateContext'
import type { BoardCategory } from '../types/board'
import type { RoundId } from '../types/game'
import { cellKey } from '../types/game'
import { Cell } from './Cell'
import { ResolvePanel } from './ResolvePanel'
import { ParticleBurst } from './ParticleBurst'
import { EmojiShower } from './EmojiShower'
import { VortexPullIn } from './VortexPullIn'
import { BeeSwarm } from './BeeSwarm'
import { pickTileAnimation } from '../lib/tileAnimations'
import { pickParticleEffect } from '../lib/particleEffects'
import { playOpenSound } from '../hooks/useSound'

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

interface RevealState<TCell> {
  key: string
  cell: TCell
  teamId: string | null
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
  const [revealing, setRevealing] = useState<RevealState<TCell> | null>(null)

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

  const modalKey = activeKey ?? revealing?.key ?? null
  const cardAnimation = useMemo(() => (modalKey ? pickTileAnimation() : null), [modalKey])
  const particleEffect = useMemo(() => (modalKey ? pickParticleEffect() : null), [modalKey])

  const closeModal = () => {
    if (revealing) {
      setRevealing(null)
    } else if (activeCatIdx >= 0) {
      cancelCell(round, activeCatIdx, activeRowIdx)
    }
  }

  const handleResolve = (teamId: string | null) => {
    if (!activeCell || !activeKey) return
    resolveCell(round, activeCatIdx, activeRowIdx, activeCell.points, teamId)
    setRevealing({ key: activeKey, cell: activeCell, teamId })
  }

  const pickerTeam = state.teams.find((t) => t.id === roundState.currentPickerTeamId)
  const resolvedEntries = Object.entries(roundState.cells).filter(
    ([, v]) => v.status === 'resolved',
  )
  const winner = revealing ? state.teams.find((t) => t.id === revealing.teamId) : undefined

  return (
    <div className="max-w-5xl mx-auto">
      {state.teams.length === 0 && (
        <p className="text-center font-body text-ink/50 mb-3">
          No teams yet — add teams on the Setup tab before playing.
        </p>
      )}

      {pickerTeam && !activeKey && !revealing && (
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
                disabled={Boolean(activeKey) || Boolean(revealing)}
                isLastResolved={key === roundState.lastResolvedKey}
                onUndo={() => undoLastResolved(round)}
                onClick={() => {
                  selectCell(round, catIdx, rowIdx)
                  playOpenSound()
                }}
              />
            )
          }),
        )}
      </div>

      <AnimatePresence>
        {(activeCell || revealing) && cardAnimation && (
          <motion.div
            className="fixed inset-0 bg-ink-deep/95 flex flex-col items-center justify-center p-8 z-50 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={closeModal}
          >
            {activeCell &&
              !revealing &&
              particleEffect &&
              (particleEffect.kind === 'radial' ? (
                <ParticleBurst key={`particles-${modalKey}`} colors={particleEffect.colors} />
              ) : particleEffect.kind === 'emoji-shower' ? (
                <EmojiShower key={`particles-${modalKey}`} emoji={particleEffect.emoji} />
              ) : particleEffect.kind === 'vortex-pull-in' ? (
                <VortexPullIn key={`particles-${modalKey}`} colors={particleEffect.colors} />
              ) : (
                <BeeSwarm key={`particles-${modalKey}`} />
              ))}
            <motion.div
              key={modalKey}
              variants={{
                initial: cardAnimation.initial,
                animate: { ...cardAnimation.animate, transition: cardAnimation.transition },
                exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } },
              }}
              initial="initial"
              animate="animate"
              exit="exit"
              className={`relative max-w-2xl w-full rounded-2xl border-4 p-8 bg-yellow shadow-2xl ${
                accent === 'honey' ? 'border-honey' : 'border-violet'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeModal}
                aria-label={revealing ? 'Continue' : 'Close without resolving'}
                title={revealing ? 'Continue' : 'Close without resolving (clicked by accident)'}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full text-ink/50 hover:text-buzz hover:bg-ink/10 transition-all duration-150 hover:scale-110"
              >
                ✕
              </button>

              {revealing ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6, rotate: -6 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  <p className="font-body text-xs uppercase tracking-[0.3em] text-ink/50 mb-2">
                    The answer was
                  </p>
                  <p className="font-display text-4xl sm:text-5xl text-ink mb-4 px-4">
                    {renderReveal(revealing.cell)}
                  </p>
                  <p
                    className={`font-body font-bold text-lg mb-6 ${winner ? 'text-ink' : 'text-buzz'}`}
                  >
                    {winner ? `${winner.name} got it! +${revealing.cell.points} pts` : 'Nobody got it'}
                  </p>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={closeModal}
                    className="px-6 py-2 rounded-lg bg-ink text-yellow font-semibold hover:brightness-125"
                  >
                    Continue
                  </motion.button>
                </motion.div>
              ) : activeCell ? (
                <>
                  <p className="font-body text-2xl sm:text-3xl font-semibold text-ink mb-2 px-4">
                    {renderPrompt(activeCell)}
                  </p>
                  <ResolvePanel points={activeCell.points} onResolve={handleResolve} />
                </>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!activeKey && !revealing && resolvedEntries.length > 0 && (
        <details className="mt-6 font-body text-ink/50 text-sm">
          <summary className="cursor-pointer">Resolved so far</summary>
          <ul className="mt-2 space-y-1 text-left max-w-md mx-auto font-mono text-xs">
            {resolvedEntries.map(([key, v]) => {
              const [c, r] = key.split('-').map(Number)
              const cell = categories[c]?.cells[r]
              if (!cell) return null
              const entryWinner = state.teams.find((t) => t.id === v.wonBy)
              return (
                <li key={key}>
                  {categories[c].name} — ${cell.points}: {renderReveal(cell)} (
                  {entryWinner ? entryWinner.name : 'unanswered'})
                </li>
              )
            })}
          </ul>
        </details>
      )}
    </div>
  )
}
