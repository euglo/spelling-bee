import type { RoundId } from '../types/game'

export type Award = 'full' | 'half' | 'none'
export type Phase = 'attempt' | 'steal' | 'daily'
export type Tone = 'good' | 'partial' | 'bad'

export interface Outcome {
  id: string
  label: string
  award: Award
  /** deducts instead of awarding — Round 2 only, see the tables below */
  negative?: boolean
  opensSteal?: boolean
  verb: string
  tone: Tone
}

const ROUND1_ATTEMPT: Outcome[] = [
  { id: 'perfect', label: 'Spelled it perfectly', award: 'full', verb: 'spelled it perfectly', tone: 'good' },
  {
    id: 'one-mistake',
    label: 'One mistake, recovered',
    award: 'half',
    verb: 'spelled it with one mistake',
    tone: 'partial',
  },
  { id: 'missed', label: 'Missed it', award: 'none', opensSteal: true, verb: 'missed it', tone: 'bad' },
]

const ROUND1_STEAL: Outcome[] = [
  { id: 'stole', label: 'Stole it!', award: 'full', verb: 'stole it', tone: 'good' },
  { id: 'steal-missed', label: 'Missed it', award: 'none', verb: 'missed the steal', tone: 'bad' },
]

const ROUND2_ATTEMPT: Outcome[] = [
  {
    id: 'answer-and-spelling',
    label: 'Answer + spelling',
    award: 'full',
    verb: 'got the answer and spelled it',
    tone: 'good',
  },
  {
    id: 'answer-only',
    label: 'Right answer, misspelled',
    award: 'half',
    verb: 'got the answer right but misspelled it',
    tone: 'partial',
  },
  {
    id: 'wrong',
    label: 'Wrong answer',
    award: 'full',
    negative: true,
    opensSteal: true,
    verb: 'got it wrong',
    tone: 'bad',
  },
]

const ROUND2_STEAL: Outcome[] = [
  {
    id: 'steal-answer-and-spelling',
    label: 'Answer + spelling',
    award: 'full',
    verb: 'stole it with the answer and spelling',
    tone: 'good',
  },
  {
    id: 'steal-answer-only',
    label: 'Right answer, misspelled',
    award: 'half',
    verb: 'stole the answer but misspelled it',
    tone: 'partial',
  },
  {
    id: 'steal-missed',
    label: 'Missed it',
    award: 'full',
    negative: true,
    verb: 'missed the steal',
    tone: 'bad',
  },
]

// Daily Double: the wager stands in for the cell's face value, and only the
// selecting team may answer — no steal, per real Jeopardy.
const ROUND2_DAILY: Outcome[] = [
  {
    id: 'daily-answer-and-spelling',
    label: 'Answer + spelling',
    award: 'full',
    verb: 'nailed the Daily Double',
    tone: 'good',
  },
  {
    id: 'daily-answer-only',
    label: 'Right answer, misspelled',
    award: 'half',
    verb: 'got the answer but misspelled it',
    tone: 'partial',
  },
  {
    id: 'daily-wrong',
    label: 'Wrong answer',
    award: 'full',
    negative: true,
    verb: 'blew the Daily Double',
    tone: 'bad',
  },
]

export function outcomesFor(round: RoundId, phase: Phase): Outcome[] {
  if (round === 'round1') return phase === 'steal' ? ROUND1_STEAL : ROUND1_ATTEMPT
  if (phase === 'daily') return ROUND2_DAILY
  return phase === 'attempt' ? ROUND2_ATTEMPT : ROUND2_STEAL
}

export function findOutcome(round: RoundId, phase: Phase, id: string): Outcome | undefined {
  return outcomesFor(round, phase).find((o) => o.id === id)
}

export function awardPoints(cellPoints: number, award: Award): number {
  if (award === 'full') return cellPoints
  if (award === 'half') return Math.round(cellPoints / 2)
  return 0
}

/** The score change an outcome produces — negative for the deducting ones. */
export function signedAward(cellPoints: number, outcome: Outcome): number {
  const magnitude = awardPoints(cellPoints, outcome.award)
  return outcome.negative ? -magnitude : magnitude
}

/** Real Jeopardy's Daily Double ceiling: the greater of the team's score or the
 *  board's top clue value, so a team at zero (or negative) can still bet big. */
export function maxWager(teamScore: number, boardMax: number): number {
  return Math.max(teamScore, boardMax)
}

export const MIN_WAGER = 100
export const WAGER_STEP = 100

export interface ResolutionSummary {
  attemptedBy: string | null
  attemptOutcomeId: string
  stealBy?: string | null
  stealOutcomeId?: string
  /** attempt outcome came from the Daily Double table, and points are the wager */
  daily?: boolean
}

export interface DescribedLine {
  text: string
  tone: Tone
}

function describeLine(
  teamId: string | null | undefined,
  outcome: Outcome,
  cellPoints: number,
  teamName: (id: string | null | undefined) => string,
): DescribedLine {
  const delta = signedAward(cellPoints, outcome)
  if (delta === 0) return { text: `${teamName(teamId)} ${outcome.verb}.`, tone: outcome.tone }
  const sign = delta > 0 ? '+' : '−'
  return {
    text: `${teamName(teamId)} ${outcome.verb} — ${sign}${Math.abs(delta)} pts`,
    tone: outcome.tone,
  }
}

export function describeResolution(
  round: RoundId,
  summary: ResolutionSummary,
  cellPoints: number,
  teamName: (id: string | null | undefined) => string,
): DescribedLine[] {
  const attemptOutcome = findOutcome(
    round,
    summary.daily ? 'daily' : 'attempt',
    summary.attemptOutcomeId,
  )
  if (!attemptOutcome) return []

  const lines = [describeLine(summary.attemptedBy, attemptOutcome, cellPoints, teamName)]

  if (summary.stealOutcomeId) {
    const stealOutcome = findOutcome(round, 'steal', summary.stealOutcomeId)
    if (stealOutcome) {
      lines.push(describeLine(summary.stealBy, stealOutcome, cellPoints, teamName))
    }
  } else if (attemptOutcome.opensSteal) {
    lines.push({ text: 'Nobody stole it.', tone: 'bad' })
  }

  return lines
}
