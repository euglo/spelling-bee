import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameState } from '../state/GameStateContext'
import type { Team } from '../types/game'
import { maxWager, MIN_WAGER, WAGER_STEP } from '../lib/scoring'
import { EmojiShower } from './EmojiShower'

interface DailyDoubleProps {
  /** highest clue value on the board — the wager floor-ceiling per real Jeopardy */
  boardMax: number
  /** this cell's face value, used as the default wager */
  cellPoints: number
  pickerTeamId: string | null
  onLockIn: (teamId: string, wager: number) => void
}

// Deliberately loud red-and-gold treatment for the Chinese cultural theme —
// this is the one moment in the game that takes over the whole screen.
export function DailyDoubleSplash({ onContinue }: { onContinue: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center cursor-pointer"
      style={{
        background:
          'radial-gradient(circle at center, var(--color-lucky-red) 0%, #7a0f08 60%, #2b0503 100%)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onContinue}
    >
      <EmojiShower emoji="🐉" />
      <motion.div
        className="relative text-center px-8"
        initial={{ scale: 0.4, rotate: -8, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 12 }}
      >
        <p className="font-display text-6xl sm:text-8xl text-lucky-gold tracking-[0.15em] drop-shadow-[0_4px_0_rgba(0,0,0,0.35)]">
          加倍
        </p>
        <p className="font-display text-4xl sm:text-6xl text-yellow tracking-[0.3em] mt-2">
          DAILY DOUBLE
        </p>
        <p className="font-body text-lucky-gold/80 text-xl mt-6">🧧 Tap to place your wager 🏮</p>
      </motion.div>
    </motion.div>
  )
}

export function DailyDoubleWager({ boardMax, cellPoints, pickerTeamId, onLockIn }: DailyDoubleProps) {
  const { state } = useGameState()
  const [teamId, setTeamId] = useState<string | null>(pickerTeamId)
  const team = state.teams.find((t) => t.id === teamId)
  const cap = maxWager(team?.score ?? 0, boardMax)
  // default to the clue's own value, not the cap — a stray "Lock it in"
  // shouldn't bet the team's whole score
  const [wager, setWager] = useState(Math.min(cellPoints, cap))

  if (!team) {
    return (
      <div className="mt-6 font-body">
        <p className="text-ink/60 text-2xl mb-3">Who found the Daily Double?</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {state.teams.map((t: Team) => (
            <motion.button
              key={t.id}
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTeamId(t.id)}
              className="px-6 py-3 rounded-lg text-xl bg-ink text-yellow font-semibold hover:brightness-125"
            >
              {t.name}
            </motion.button>
          ))}
        </div>
      </div>
    )
  }

  const clamped = Math.min(Math.max(wager, MIN_WAGER), cap)

  return (
    <div className="mt-6 font-body">
      <p className="text-ink/60 text-2xl mb-1">
        <span className="text-ink font-bold">{team.name}</span> wagers
      </p>
      <p className="text-ink/50 text-sm mb-4 font-mono">
        score {team.score} · max {cap}
        {cap > team.score && ' (board maximum)'}
      </p>

      <p className="font-display text-6xl text-lucky-red mb-4 tabular-nums">{clamped}</p>

      <input
        type="range"
        min={MIN_WAGER}
        max={cap}
        step={WAGER_STEP}
        value={clamped}
        onChange={(e) => setWager(Number(e.target.value))}
        aria-label="Wager amount"
        className="w-full max-w-md accent-lucky-red mb-2"
      />
      <div className="flex justify-between max-w-md mx-auto font-mono text-xs text-ink/40 mb-4">
        <span>{MIN_WAGER}</span>
        <span>{cap}</span>
      </div>

      <p className="font-body text-lg mb-4">
        <span className="text-ink font-bold">+{clamped}</span> if they nail it ·{' '}
        <span className="text-buzz font-bold">−{clamped}</span> if they miss
      </p>

      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onLockIn(team.id, clamped)}
        className="px-8 py-3 rounded-lg text-xl bg-lucky-red text-lucky-gold font-bold hover:brightness-110"
      >
        Lock it in 🐉
      </motion.button>
    </div>
  )
}
