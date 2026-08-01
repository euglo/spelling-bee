import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useGameState } from '../state/GameStateContext'
import type { BoardCategory } from '../types/board'
import type { RoundId } from '../types/game'
import { cellKey } from '../types/game'
import { Cell } from './Cell'
import { ResolvePanel, type ResolutionResult } from './ResolvePanel'
import { ParticleBurst } from './ParticleBurst'
import { EmojiShower } from './EmojiShower'
import { VortexPullIn } from './VortexPullIn'
import { BeeSwarm } from './BeeSwarm'
import { DailyDoubleSplash, DailyDoubleWager } from './DailyDouble'
import { pickTileAnimation } from '../lib/tileAnimations'
import { pickParticleEffect } from '../lib/particleEffects'
import { playOpenSound, playDoubleSound } from '../hooks/useSound'
import { findOutcome, signedAward, describeResolution } from '../lib/scoring'
import type { ScoreDelta } from '../types/game'

interface CellLike {
  points: number
  daily?: boolean
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
  resolution: ResolutionResult
  /** wager on a Daily Double, otherwise the cell's face value */
  points: number
}

/** splash → wager, then the clue renders as normal */
type DailyStep = 'splash' | 'wager'

const toneClass: Record<'good' | 'partial' | 'bad', string> = {
  good: 'text-ink',
  partial: 'text-honey',
  bad: 'text-buzz',
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
  const [dailyStep, setDailyStep] = useState<DailyStep | null>(null)
  const [wager, setWager] = useState<number | null>(null)
  const [dailyTeamId, setDailyTeamId] = useState<string | null>(null)

  const boardMax = Math.max(0, ...categories.flatMap((c) => c.cells.map((cell) => cell.points)))

  const activeEntry = Object.entries(roundState.cells).find(([, v]) => v.status === 'in-play')
  const activeKey = activeEntry?.[0] ?? null

  const wrapperRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // The picker line and the resolved-so-far toggle are both suppressed while
  // any modal is open (`!activeKey && !revealing`) and only actually take up
  // space once idle — refit whenever that visibility flips, not just when
  // the underlying picker/resolved state changes.
  const hasResolved = Object.values(roundState.cells).some((c) => c.status === 'resolved')
  const idle = !activeKey && !revealing

  const NATURAL_MAX_WIDTH = 1800

  // Cells keep a fixed aspect ratio, so a grid's height scales linearly with
  // its width. Boards with few rows (round 1) fit fine at the natural cap;
  // boards with many rows (round 2) don't. Reset to natural width, measure,
  // and — if that overflows the viewport — shrink to the exact width that
  // doesn't, using the page's *actual* chrome (nav, title, picker line,
  // resolved-log toggle) rather than a guessed buffer, so it stays correct
  // as that chrome appears and disappears during play.
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current
    const grid = gridRef.current
    if (!wrapper || !grid) return

    function fit() {
      if (!wrapper || !grid) return
      wrapper.style.maxWidth = `${NATURAL_MAX_WIDTH}px`

      const headerCells = Array.from(grid.children).slice(0, categories.length) as HTMLElement[]
      const headerHeight = Math.max(0, ...headerCells.map((el) => el.getBoundingClientRect().height))
      const rect = grid.getBoundingClientRect()
      const rowsPortion = rect.height - headerHeight
      if (rowsPortion <= 0) return

      const SAFETY = 24
      const bottomChrome = Math.max(0, document.documentElement.scrollHeight - (rect.top + rect.height))
      const available = window.innerHeight - rect.top - bottomChrome - SAFETY
      const targetRowsPortion = available - headerHeight
      if (targetRowsPortion >= rowsPortion) return // natural width already fits

      const ratio = Math.max(targetRowsPortion, 0) / rowsPortion
      wrapper.style.maxWidth = `${Math.max(rect.width * ratio, 480)}px`
    }

    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [categories, maxRows, idle, hasResolved])

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

  const isDaily = Boolean(activeCell?.daily)
  // On a Daily Double the locked-in wager stands in for the cell's face value.
  const effectivePoints = isDaily ? (wager ?? 0) : (activeCell?.points ?? 0)

  const resetDaily = () => {
    setDailyStep(null)
    setWager(null)
    setDailyTeamId(null)
  }

  const closeModal = () => {
    if (revealing) {
      setRevealing(null)
    } else if (activeCatIdx >= 0) {
      cancelCell(round, activeCatIdx, activeRowIdx)
      resetDaily()
    }
  }

  const handleResolve = (result: ResolutionResult) => {
    if (!activeCell || !activeKey) return
    const attemptOutcome = findOutcome(
      round,
      isDaily ? 'daily' : 'attempt',
      result.attemptOutcomeId,
    )
    if (!attemptOutcome) return

    // Both the picker and a stealer can move on one cell, so collect signed
    // deltas rather than a single award. Only a positive net wins the board.
    const deltas: ScoreDelta[] = []
    let winningTeamId: string | null = null

    const attemptDelta = signedAward(effectivePoints, attemptOutcome)
    if (attemptDelta !== 0) {
      deltas.push({ teamId: result.attemptedBy, points: attemptDelta })
      if (attemptDelta > 0) winningTeamId = result.attemptedBy
    }

    if (result.stealOutcomeId && result.stealBy) {
      const stealOutcome = findOutcome(round, 'steal', result.stealOutcomeId)
      if (stealOutcome) {
        const stealDelta = signedAward(effectivePoints, stealOutcome)
        if (stealDelta !== 0) {
          deltas.push({ teamId: result.stealBy, points: stealDelta })
          if (stealDelta > 0) winningTeamId = result.stealBy
        }
      }
    }

    resolveCell(round, activeCatIdx, activeRowIdx, {
      deltas,
      winningTeamId,
      attemptedBy: result.attemptedBy,
      attemptOutcomeId: result.attemptOutcomeId,
      stealBy: result.stealBy,
      stealOutcomeId: result.stealOutcomeId,
      daily: isDaily,
      wager: isDaily ? effectivePoints : undefined,
    })
    setRevealing({ key: activeKey, cell: activeCell, resolution: result, points: effectivePoints })
    resetDaily()
  }

  const teamName = (id: string | null | undefined) => state.teams.find((t) => t.id === id)?.name ?? 'They'

  const pickerTeam = state.teams.find((t) => t.id === roundState.currentPickerTeamId)
  const resolvedEntries = Object.entries(roundState.cells).filter(
    ([, v]) => v.status === 'resolved',
  )

  return (
    <div ref={wrapperRef} className="mx-auto max-w-[1800px]">
      {state.teams.length === 0 && (
        <p className="text-center font-body text-lg text-ink/50 mb-3">
          No teams yet — add teams on the Setup tab before playing.
        </p>
      )}

      {pickerTeam && !activeKey && !revealing && (
        <p className="text-center font-body text-lg text-ink/70 mb-3">
          <span className="text-ink font-bold">{pickerTeam.name}</span> picks the next board.
        </p>
      )}

      <div
        ref={gridRef}
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${categories.length}, minmax(0,1fr))` }}
      >
        {categories.map((cat) => (
          <div
            key={cat.name}
            className={`font-display ${HEADER_ACCENT[accent]} text-center py-1.5 text-xl sm:text-2xl tracking-wide uppercase flex items-center justify-center border-b-2 border-ink/15`}
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
                  if (cell.daily) {
                    setDailyStep('splash')
                    playDoubleSound()
                  } else {
                    playOpenSound()
                  }
                }}
              />
            )
          }),
        )}
      </div>

      <AnimatePresence>
        {activeCell && isDaily && dailyStep === 'splash' && (
          <DailyDoubleSplash key="daily-splash" onContinue={() => setDailyStep('wager')} />
        )}
      </AnimatePresence>

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
            {/* Daily Doubles get the dragon shower instead of a random effect —
                the two firing together looked like a bug. */}
            {activeCell &&
              !revealing &&
              !isDaily &&
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
                  <div className="mb-6">
                    {describeResolution(round, revealing.resolution, revealing.points, teamName).map(
                      (line, i) => (
                        <p key={i} className={`font-body font-bold text-2xl ${toneClass[line.tone]}`}>
                          {line.text}
                        </p>
                      ),
                    )}
                  </div>
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
              ) : activeCell && isDaily && dailyStep ? (
                // Clue stays hidden until the wager is locked in, as in real Jeopardy.
                dailyStep === 'wager' ? (
                  <DailyDoubleWager
                    boardMax={boardMax}
                    cellPoints={activeCell.points}
                    pickerTeamId={roundState.currentPickerTeamId}
                    onLockIn={(teamId, amount) => {
                      setDailyTeamId(teamId)
                      setWager(amount)
                      setDailyStep(null)
                    }}
                  />
                ) : null
              ) : activeCell ? (
                <>
                  {/* div, not p — renderPrompt may return block content (figure/img) */}
                  <div className="font-body text-2xl sm:text-3xl font-semibold text-ink mb-2 px-4">
                    {renderPrompt(activeCell)}
                  </div>
                  <ResolvePanel
                    round={round}
                    points={effectivePoints}
                    daily={isDaily}
                    pickerTeamId={isDaily ? dailyTeamId : roundState.currentPickerTeamId}
                    onResolve={handleResolve}
                  />
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
              const face = v.wager ?? cell.points
              return (
                <li key={key}>
                  {categories[c].name} — ${face}
                  {v.wager != null && ' (DD)'}: {renderReveal(cell)}{' '}
                  {(v.deltas ?? []).length === 0
                    ? '(no change)'
                    : (v.deltas ?? [])
                        .map((d) => {
                          const name = state.teams.find((t) => t.id === d.teamId)?.name ?? '?'
                          return `${name} ${d.points > 0 ? '+' : '−'}${Math.abs(d.points)}`
                        })
                        .join(', ')}
                </li>
              )
            })}
          </ul>
        </details>
      )}
    </div>
  )
}
