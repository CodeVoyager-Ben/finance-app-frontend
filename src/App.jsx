import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import useAuthStore from './store/authStore'
import MainLayout from './components/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Calendar from './pages/Calendar'
import Investments from './pages/Investments'
import Reports from './pages/Reports'
import Lending from './pages/Lending'
import Settings from './pages/Settings'

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const loading = useAuthStore((s) => s.loading)
  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />
  return isAuthenticated ? children : <Navigate to="/login" />
}

export default function App() {
  const fetchUser = useAuthStore((s) => s.fetchUser)
  useEffect(() => { fetchUser() }, [fetchUser])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="investments" element={<Investments />} />
        <Route path="reports" element={<Reports />} />
        <Route path="lending" element={<Lending />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
