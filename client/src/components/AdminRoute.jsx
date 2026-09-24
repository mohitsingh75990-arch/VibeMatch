import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function AdminRoute() {
  const { user, isAuthenticated } = useAuth()
  const token = localStorage.getItem('vibematch_token')

  if (!token || !isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  if (!user?.isAdmin) {
    return <Navigate to="/discover" replace />
  }

  return <Outlet />
}

export default AdminRoute
