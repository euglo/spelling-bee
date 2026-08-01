import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameState } from '../state/GameStateContext'
import type { RoundId, Team } from '../types/game'
import { outcomesFor, awardPoints, type Outcome } from '../lib/scoring'
import { playCorrectSound, playIncorrectSound } from '../hooks/useSound'

export interface ResolutionResult {
  attemptedBy: string
  attemptOutcomeId: string
  stealBy?: string
  stealOutcomeId?: string
  /** attempt outcome came from the Daily Double table */
  daily?: boolean
}

interface ResolvePanelProps {
  round: RoundId
  points: number
  pickerTeamId: string | null
  /** Daily Double: use the wager outcome table, and no steal is offered */
  daily?: boolean
  onResolve: (result: ResolutionResult) => void
}

const outcomeClasses: Record<Outcome['tone'], string> = {
  good: 'px-6 py-3 rounded-lg text-xl bg-ink text-yellow font-semibold hover:brightness-125',
  partial:
    'px-6 py-3 rounded-lg text-xl border-2 border-honey text-honey font-semibold hover:bg-honey/10',
  bad: 'px-6 py-3 rounded-lg text-xl border-2 border-buzz text-buzz font-semibold hover:bg-buzz/10',
}

const teamButtonClasses =
  'px-6 py-3 rounded-lg text-xl bg-ink text-yellow font-semibold hover:brightness-125'

function OutcomeButtons({
  outcomes,
  points,
  onPick,
}: {
  outcomes: Outcome[]
  points: number
  onPick: (outcome: Outcome) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {outcomes.map((outcome) => (
        <motion.button
          key={outcome.id}
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (outcome.tone === 'bad') playIncorrectSound()
            else playCorrectSound()
            onPick(outcome)
          }}
          className={outcomeClasses[outcome.tone]}
        >
          {outcome.label}
          {outcome.award !== 'none' && (
            <span className="font-mono">
              {' '}
              {outcome.negative ? '−' : '+'}
              {awardPoints(points, outcome.award)}
            </span>
          )}
        </motion.button>
      ))}
    </div>
  )
}

function TeamPicker({
  prompt,
  teams,
  onPick,
}: {
  prompt: string
  teams: Team[]
  onPick: (id: string) => void
}) {
  return (
    <div className="mt-6 font-body">
      <p className="text-ink/60 text-2xl mb-3">{prompt}</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {teams.map((team) => (
          <motion.button
            key={team.id}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPick(team.id)}
            className={teamButtonClasses}
          >
            {team.name}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

export function ResolvePanel({ round, points, pickerTeamId, daily, onResolve }: ResolvePanelProps) {
  const { state } = useGameState()
  const [attemptedBy, setAttemptedBy] = useState<string | null>(pickerTeamId)
  const [attemptOutcome, setAttemptOutcome] = useState<Outcome | null>(null)
  const [stealBy, setStealBy] = useState<string | null>(null)

  if (!attemptedBy) {
    return <TeamPicker prompt="Who's up?" teams={state.teams} onPick={setAttemptedBy} />
  }

  const attemptTeam = state.teams.find((t) => t.id === attemptedBy)

  if (!attemptOutcome) {
    return (
      <div className="mt-6 font-body">
        <p className="text-ink/60 text-2xl mb-3">
          <span className="text-ink font-bold">{attemptTeam?.name}</span> —{' '}
          <span className="font-mono text-ink font-bold">{points} pts</span>
        </p>
        <OutcomeButtons
          outcomes={outcomesFor(round, daily ? 'daily' : 'attempt')}
          points={points}
          onPick={(outcome) => {
            // No steal on a Daily Double — only the selecting team may answer.
            if (outcome.opensSteal && !daily) {
              setAttemptOutcome(outcome)
            } else {
              onResolve({ attemptedBy, attemptOutcomeId: outcome.id, daily })
            }
          }}
        />
      </div>
    )
  }

  if (!stealBy) {
    const stealCandidates = state.teams.filter((t) => t.id !== attemptedBy)
    return (
      <div className="mt-6 font-body">
        <p className="text-ink/60 text-2xl mb-3">Steal attempt — who's trying?</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {stealCandidates.map((team) => (
            <motion.button
              key={team.id}
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStealBy(team.id)}
              className={teamButtonClasses}
            >
              {team.name}
            </motion.button>
          ))}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              playIncorrectSound()
              onResolve({ attemptedBy, attemptOutcomeId: attemptOutcome.id })
            }}
            className="px-6 py-3 rounded-lg text-xl border-2 border-buzz text-buzz font-semibold hover:bg-buzz/10"
          >
            No steal
          </motion.button>
        </div>
      </div>
    )
  }

  const stealTeam = state.teams.find((t) => t.id === stealBy)

  return (
    <div className="mt-6 font-body">
      <p className="text-ink/60 text-2xl mb-3">
        <span className="text-ink font-bold">{stealTeam?.name}</span> steals —{' '}
        <span className="font-mono text-ink font-bold">{points} pts</span>
      </p>
      <OutcomeButtons
        outcomes={outcomesFor(round, 'steal')}
        points={points}
        onPick={(outcome) => {
          onResolve({
            attemptedBy,
            attemptOutcomeId: attemptOutcome.id,
            stealBy,
            stealOutcomeId: outcome.id,
          })
        }}
      />
    </div>
  )
}
