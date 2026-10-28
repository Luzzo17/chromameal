import { Route, Routes } from 'react-router'
import Home from './pages/Home'
import Planner from './pages/Planner'
import Account from './pages/Account'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/account" element={<Account />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/planner" element={<Planner />} />
      </Route>
    </Routes>
  )
}

export default App