import { useBoardData } from '../hooks/useBoardData'
import type { Round1Cell, Round2Cell } from '../types/board'

interface AnswerKeyProps {
  round: 'round1' | 'round2'
}

export function AnswerKey({ round }: AnswerKeyProps) {
  const path = round === 'round1' ? '/data/round1.json' : '/data/round2.json'
  const { data, loading, error } = useBoardData<Round1Cell | Round2Cell>(path)
  const headerAccent = round === 'round1' ? 'text-honey' : 'text-violet'

  if (error) return <p className="p-8 font-mono text-red-600">Failed to load: {error}</p>
  if (loading || !data) return <p className="p-8 font-mono">Loading…</p>

  return (
    <div className="relative bg-paper text-ink-deep min-h-screen p-10 print:p-6 font-mono">
      <div className="absolute top-8 right-8 rotate-[-8deg] border-4 border-buzz text-buzz font-display text-2xl tracking-[0.2em] px-4 py-1 opacity-90 print:opacity-100 select-none">
        HOST ONLY
      </div>

      <p className="text-xs uppercase tracking-[0.3em] text-ink-deep/50 mb-1">Answer key</p>
      <h1 className="font-display text-4xl tracking-wide mb-1">
        {round === 'round1' ? 'Round 1 — Spelling Bee' : 'Round 2 — Jeopardy'}
      </h1>
      <p className="text-sm text-ink-deep/60 mb-8 border-b border-dashed border-paper-line pb-4">
        Do not display to players — read from this card only.
      </p>

      {data.categories.map((cat) => (
        <div key={cat.name} className="mb-8 break-inside-avoid">
          <h2 className={`font-display text-xl tracking-widest uppercase mb-2 ${headerAccent}`}>
            {cat.name}
          </h2>
          <table className="w-full text-sm border-collapse">
            <tbody>
              {cat.cells.map((cell, i) => (
                <tr key={i} className="border-b border-dashed border-paper-line">
                  <td className="py-1.5 pr-3 font-semibold w-16 align-top">${cell.points}</td>
                  {round === 'round1' ? (
                    <>
                      <td className="py-1.5 pr-3 font-semibold w-40 align-top">
                        {(cell as Round1Cell).word}
                      </td>
                      <td className="py-1.5 text-ink-deep/70 align-top">
                        {(cell as Round1Cell).hint}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="py-1.5 pr-3 text-ink-deep/80 align-top">
                        {(cell as Round2Cell).clue}
                      </td>
                      <td className="py-1.5 font-semibold w-40 align-top">
                        {(cell as Round2Cell).answer}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
