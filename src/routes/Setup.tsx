import { useState, type FormEvent } from 'react'
import { useGameState } from '../state/GameStateContext'

export function Setup() {
  const { state, addTeam, removeTeam, renameTeam, resetGame } = useGameState()
  const [name, setName] = useState('')

  const handleAdd = (e: FormEvent) => {
    e.preventDefault()
    addTeam(name)
    setName('')
  }

  return (
    <div className="max-w-xl mx-auto font-body">
      <h1 className="font-display text-4xl text-gold mb-6 tracking-wide">Team Setup</h1>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Team name"
          className="flex-1 rounded-lg px-3 py-2 bg-white text-ink-deep placeholder:text-ink-deep/40"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-gold text-ink-deep font-semibold hover:brightness-95"
        >
          Add team
        </button>
      </form>

      <ul className="space-y-2">
        {state.teams.map((team) => (
          <li
            key={team.id}
            className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 border border-white/10"
          >
            <input
              value={team.name}
              onChange={(e) => renameTeam(team.id, e.target.value)}
              className="flex-1 bg-transparent text-white outline-none"
            />
            <span className="font-mono text-white/50 text-sm tabular-nums">{team.score} pts</span>
            <button
              type="button"
              onClick={() => removeTeam(team.id)}
              className="text-white/40 hover:text-buzz px-2"
              aria-label={`Remove ${team.name}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      {state.teams.length === 0 && (
        <p className="text-white/40">Add at least two teams to get started.</p>
      )}

      <button
        type="button"
        onClick={() => {
          if (confirm('Reset all teams and scores? This cannot be undone.')) resetGame()
        }}
        className="mt-8 text-sm text-white/40 hover:text-buzz underline"
      >
        Reset game
      </button>
    </div>
  )
}
