import { motion } from 'framer-motion'
import { useGameState } from '../state/GameStateContext'
import { playCorrectSound, playIncorrectSound } from '../hooks/useSound'

interface ResolvePanelProps {
  points: number
  onResolve: (winningTeamId: string | null) => void
}

export function ResolvePanel({ points, onResolve }: ResolvePanelProps) {
  const { state } = useGameState()

  return (
    <div className="mt-6 font-body">
      <p className="text-ink/60 mb-3">
        Who got it right? <span className="font-mono text-ink font-bold">{points} pts</span>
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {state.teams.map((team) => (
          <motion.button
            key={team.id}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              playCorrectSound()
              onResolve(team.id)
            }}
            className="px-4 py-2 rounded-lg bg-ink text-yellow font-semibold hover:brightness-125"
          >
            {team.name} got it!
          </motion.button>
        ))}
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            playIncorrectSound()
            onResolve(null)
          }}
          className="px-4 py-2 rounded-lg border-2 border-buzz text-buzz font-semibold hover:bg-buzz/10"
        >
          Nobody got it
        </motion.button>
      </div>
    </div>
  )
}
