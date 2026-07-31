import { Navigate, Route, Routes } from 'react-router-dom'
import { GameStateProvider } from './state/GameStateContext'
import { Layout } from './components/Layout'
import { RequireTeams } from './components/RequireTeams'
import { Setup } from './routes/Setup'
import { Round1Board } from './routes/Round1Board'
import { Round2Board } from './routes/Round2Board'
import { AnswerKey } from './routes/AnswerKey'

function App() {
  return (
    <GameStateProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/setup" replace />} />
          <Route path="/setup" element={<Setup />} />
          <Route element={<RequireTeams />}>
            <Route path="/round-1" element={<Round1Board />} />
            <Route path="/round-2" element={<Round2Board />} />
          </Route>
        </Route>
        <Route path="/round-1/answer-key" element={<AnswerKey round="round1" />} />
        <Route path="/round-2/answer-key" element={<AnswerKey round="round2" />} />
      </Routes>
    </GameStateProvider>
  )
}

export default App
