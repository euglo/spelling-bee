import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Scoreboard } from './Scoreboard'
import { useSoundEnabled } from '../hooks/useSound'
import { useGameState } from '../state/GameStateContext'

const tabs = [
  { to: '/setup', label: 'Setup' },
  { to: '/round-1', label: 'Round 1' },
  { to: '/round-2', label: 'Round 2' },
]

export function Layout() {
  const [soundEnabled, setSoundEnabled] = useSoundEnabled()
  const { state, resetGame } = useGameState()
  const navigate = useNavigate()
  const teamsReady = state.teams.length >= 2

  const handleReset = () => {
    if (
      confirm(
        'Reset the entire game? This clears every team, score, and answered tile in both rounds.',
      )
    ) {
      resetGame()
      navigate('/setup')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-yellow text-ink">
      <header className="bg-ink">
        <nav className="flex gap-2 px-6 pt-3 items-center">
          {tabs.map((tab) => {
            const locked = tab.to !== '/setup' && !teamsReady
            if (locked) {
              return (
                <span
                  key={tab.to}
                  title="Add at least 2 teams in Setup to unlock"
                  className="px-5 py-1.5 rounded-t-lg font-display text-lg tracking-widest text-yellow/15 cursor-not-allowed select-none"
                >
                  {tab.label}
                </span>
              )
            }
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                className={({ isActive }) =>
                  `px-5 py-1.5 rounded-t-lg font-display text-lg tracking-widest transition-all duration-150 hover:scale-105 ${
                    isActive ? 'bg-yellow text-ink' : 'text-yellow/50 hover:text-yellow/80'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            )
          })}
          <button
            type="button"
            onClick={handleReset}
            title="Reset all teams, scores, and progress"
            className="ml-auto px-3 py-1.5 rounded-t-lg font-body text-sm font-semibold text-yellow/40 hover:text-buzz transition-all duration-150 hover:scale-105"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="px-3 py-1.5 rounded-t-lg text-yellow/50 hover:text-yellow transition-transform duration-150 hover:scale-110"
            aria-label={soundEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
        </nav>
        <Scoreboard />
      </header>
      <main className="flex-1 px-6 py-4">
        <Outlet />
      </main>
    </div>
  )
}
