import Home from './pages/Home'
import Planner from './pages/Planner'
import Account from './pages/Account'
import { Route, Routes } from 'react-router'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/planner" element={<Planner />} />
      <Route path="/account" element={<Account />} />
    </Routes>
  )
}

export default App
