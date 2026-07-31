import { useGameState } from '../state/GameStateContext'

export function Scoreboard() {
  const { state } = useGameState()
  const teams = [...state.teams].sort((a, b) => b.score - a.score)

  if (teams.length === 0) {
    return (
      <div className="px-6 py-3 font-body text-sm text-white/40 bg-ink-deep/60">
        No teams yet — head to Setup to add teams.
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-3 px-6 py-3 bg-ink-deep/60">
      {teams.map((team, i) => (
        <div
          key={team.id}
          className={`flex items-baseline gap-2 px-4 py-1.5 rounded-full text-sm font-body font-semibold ${
            i === 0 ? 'bg-gold text-ink-deep' : 'bg-white/10 text-white'
          }`}
        >
          <span>{team.name}</span>
          <span className="font-mono tabular-nums">{team.score}</span>
        </div>
      ))}
    </div>
  )
}
