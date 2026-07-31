import { Navigate, Outlet } from 'react-router-dom'
import { useGameState } from '../state/GameStateContext'

export function RequireTeams() {
  const { state } = useGameState()
  if (state.teams.length < 2) return <Navigate to="/setup" replace />
  return <Outlet />
}
