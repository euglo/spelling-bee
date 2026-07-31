import { useBoardData } from '../hooks/useBoardData'
import { JeopardyBoard } from '../components/JeopardyBoard'
import type { Round2Cell } from '../types/board'

export function Round2Board() {
  const { data, loading, error } = useBoardData<Round2Cell>('/data/round2.json')

  if (error) return <p className="font-body text-red-400">Failed to load Round 2 data: {error}</p>
  if (loading || !data) return <p className="font-body text-white/50">Loading board…</p>

  return (
    <div>
      <div className="text-center mb-6">
        <p className="font-display text-violet tracking-[0.3em] text-sm mb-1">💡 ROUND TWO</p>
        <h1 className="font-display text-4xl sm:text-5xl text-white tracking-wide">
          Spell the Answer
        </h1>
      </div>
      <JeopardyBoard
        round="round2"
        categories={data.categories}
        accent="violet"
        shape="rect"
        renderPrompt={(cell) => cell.clue}
        renderReveal={(cell) => cell.answer}
      />
    </div>
  )
}
