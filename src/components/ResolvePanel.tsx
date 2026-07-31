import { useGameState } from '../state/GameStateContext'
import { playCorrectSound, playIncorrectSound } from '../hooks/useSound'

interface ResolvePanelProps {
  points: number
  onResolve: (winningTeamId: string | null) => void
}

export function ResolvePanel({ points, onResolve }: ResolvePanelProps) {
  const { state } = useGameState()

  return (
    <div className="mt-8 font-body">
      <p className="text-white/60 mb-3">
        Who got it right? <span className="font-mono text-gold">{points} pts</span>
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {state.teams.map((team) => (
          <button
            key={team.id}
            type="button"
            onClick={() => {
              playCorrectSound()
              onResolve(team.id)
            }}
            className="px-4 py-2 rounded-lg bg-gold text-ink-deep font-semibold hover:brightness-95"
          >
            {team.name} got it!
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            playIncorrectSound()
            onResolve(null)
          }}
          className="px-4 py-2 rounded-lg border-2 border-buzz text-buzz font-semibold hover:bg-buzz/10"
        >
          Nobody got it
        </button>
      </div>
    </div>
  )
}
