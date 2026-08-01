import { useBoardData } from '../hooks/useBoardData'
import { JeopardyBoard } from '../components/JeopardyBoard'
import type { Round2Cell } from '../types/board'

// Clue body: media renders above the clue text. JeopardyBoard doesn't need to
// know about media at all — renderPrompt already returns a ReactNode.
function Round2Prompt({ cell }: { cell: Round2Cell }) {
  return (
    <>
      {cell.media?.type === 'image' && (
        <figure className="mb-4">
          <img
            src={cell.media.src}
            alt={cell.media.caption ?? cell.clue}
            className="max-h-[45vh] w-auto mx-auto rounded-xl border-4 border-ink/15 object-contain"
          />
          {cell.media.caption && (
            <figcaption className="font-body text-sm text-ink/50 mt-2">
              {cell.media.caption}
            </figcaption>
          )}
        </figure>
      )}

      {cell.media?.type === 'external' && (
        <p className="inline-block mb-4 px-4 py-2 rounded-lg bg-ink/10 border-2 border-dashed border-ink/30 font-body text-base text-ink/70">
          📺 <span className="font-bold uppercase tracking-wide">Shown on the other screen</span>
          {cell.media.label && <span className="block text-sm mt-0.5">{cell.media.label}</span>}
        </p>
      )}

      <span className="block">{cell.clue}</span>
    </>
  )
}

export function Round2Board() {
  const { data, loading, error } = useBoardData<Round2Cell>('/data/round2.json')

  if (error) return <p className="font-body text-buzz">Failed to load Round 2 data: {error}</p>
  if (loading || !data) return <p className="font-body text-ink/50">Loading board…</p>

  return (
    <div>
      <div className="text-center mb-3">
        <p className="font-display text-violet tracking-[0.3em] text-sm mb-0.5">💡 ROUND TWO</p>
        <h1 className="font-display text-3xl sm:text-4xl text-ink tracking-wide">
          Spell the Answer
        </h1>
      </div>
      <JeopardyBoard
        round="round2"
        categories={data.categories}
        accent="violet"
        shape="rect"
        renderPrompt={(cell) => <Round2Prompt cell={cell} />}
        renderReveal={(cell) => cell.answer}
      />
    </div>
  )
}
