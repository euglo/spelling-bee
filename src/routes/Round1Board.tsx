import { useBoardData } from '../hooks/useBoardData'
import { JeopardyBoard } from '../components/JeopardyBoard'
import type { Round1Cell } from '../types/board'

export function Round1Board() {
  const { data, loading, error } = useBoardData<Round1Cell>('/data/round1.json')

  if (error) return <p className="font-body text-buzz">Failed to load Round 1 data: {error}</p>
  if (loading || !data) return <p className="font-body text-ink/50">Loading board…</p>

  return (
    <div>
      <div className="text-center mb-3">
        <p className="font-display text-honey tracking-[0.3em] text-xs mb-0.5">🐝 ROUND ONE</p>
        <h1 className="font-display text-2xl sm:text-3xl text-ink tracking-wide">
          Spell the Word
        </h1>
      </div>
      <JeopardyBoard
        round="round1"
        categories={data.categories}
        accent="honey"
        shape="hex"
        renderPrompt={() => 'Gather round — spell the word one letter at a time!'}
        renderReveal={(cell) => cell.word}
      />
    </div>
  )
}
