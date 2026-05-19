import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import useAuthStore from './store/authStore'
import MainLayout from './components/MainLayout'
import Login from './pages/Login'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Transactions = lazy(() => import('./pages/Transactions'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Investments = lazy(() => import('./pages/Investments'))
const Reports = lazy(() => import('./pages/Reports'))
const Lending = lazy(() => import('./pages/Lending'))
const Settings = lazy(() => import('./pages/Settings'))

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const loading = useAuthStore((s) => s.loading)
  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />
  return isAuthenticated ? children : <Navigate to="/login" />
}

function PageLoader() {
  return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />
}

export default function App() {
  const fetchUser = useAuthStore((s) => s.fetchUser)
  useEffect(() => { fetchUser() }, [fetchUser])

  return (
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
  )
}
