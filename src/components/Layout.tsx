import { NavLink, Outlet } from 'react-router-dom'
import { Scoreboard } from './Scoreboard'
import { useSoundEnabled } from '../hooks/useSound'

const tabs = [
  { to: '/setup', label: 'Setup' },
  { to: '/round-1', label: 'Round 1' },
  { to: '/round-2', label: 'Round 2' },
]

export function Layout() {
  const [soundEnabled, setSoundEnabled] = useSoundEnabled()

  return (
    <div className="min-h-screen flex flex-col bg-ink text-white">
      <header className="border-b border-white/10">
        <nav className="flex gap-2 px-6 pt-4 items-center">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `px-5 py-2 rounded-t-lg font-display text-lg tracking-widest transition-colors ${
                  isActive ? 'bg-ink-deep text-gold' : 'text-white/50 hover:text-white/80'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="ml-auto px-3 py-2 rounded-t-lg text-white/50 hover:text-white"
            aria-label={soundEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
        </nav>
        <Scoreboard />
      </header>
      <main className="flex-1 px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
