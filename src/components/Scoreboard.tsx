import { useGameState } from '../state/GameStateContext'

export function Scoreboard() {
  const { state } = useGameState()
  const teams = [...state.teams].sort((a, b) => b.score - a.score)

  if (teams.length === 0) {
    return (
      <div className="px-6 py-2 font-body text-sm text-yellow/40 bg-black/20">
        No teams yet — head to Setup to add teams.
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-3 px-6 py-2 bg-black/20">
      {teams.map((team, i) => (
        <div
          key={team.id}
          className={`flex items-baseline gap-2 px-4 py-1.5 rounded-full text-sm font-body font-semibold ${
            i === 0 ? 'bg-yellow text-ink' : 'bg-yellow/10 text-yellow'
          }`}
        >
          <span>{team.name}</span>
          <span className="font-mono tabular-nums">{team.score}</span>
        </div>
      ))}
    </div>
  )
}
