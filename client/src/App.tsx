import Home from './pages/Home'
import Planner from './pages/Planner'
import { Route, Routes } from 'react-router'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/planner" element={<Planner />} />
    </Routes>
  )
}

export default App
