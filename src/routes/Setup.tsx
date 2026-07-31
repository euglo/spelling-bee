import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { useGameState } from '../state/GameStateContext'

export function Setup() {
  const { state, addTeam, removeTeam, renameTeam } = useGameState()
  const [name, setName] = useState('')

  const handleAdd = (e: FormEvent) => {
    e.preventDefault()
    addTeam(name)
    setName('')
  }

  return (
    <div className="max-w-xl mx-auto font-body">
      <h1 className="font-display text-4xl text-ink mb-6 tracking-wide">Team Setup</h1>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Team name"
          className="flex-1 rounded-lg px-3 py-2 bg-paper text-ink placeholder:text-ink/40 border border-ink/10"
        />
        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 rounded-lg bg-ink text-yellow font-semibold hover:brightness-125"
        >
          Add team
        </motion.button>
      </form>

      <ul className="space-y-2">
        {state.teams.map((team) => (
          <li
            key={team.id}
            className="flex items-center gap-2 bg-paper rounded-lg px-3 py-2 border border-ink/10"
          >
            <input
              value={team.name}
              onChange={(e) => renameTeam(team.id, e.target.value)}
              className="flex-1 bg-transparent text-ink outline-none"
            />
            <span className="font-mono text-ink/50 text-sm tabular-nums">{team.score} pts</span>
            <motion.button
              type="button"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => removeTeam(team.id)}
              className="text-ink/40 hover:text-buzz px-2 transition-colors"
              aria-label={`Remove ${team.name}`}
            >
              ✕
            </motion.button>
          </li>
        ))}
      </ul>

      {state.teams.length === 0 && (
        <p className="text-ink/50">Add at least two teams to get started.</p>
      )}
      {state.teams.length === 1 && (
        <p className="text-ink/50">Add one more team to unlock Round 1 and Round 2.</p>
      )}
    </div>
  )
}
