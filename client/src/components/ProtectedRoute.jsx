import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute() {
  const { user, isAuthenticated } = useAuth()
  const token = localStorage.getItem('vibematch_token')

  if (!token || !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user && user.isEmailVerified === false) {
    return (
      <Navigate
        to="/verify-email"
        replace
        state={{ email: user.email }}
      />
    )
  }

  return <Outlet />
}

export default ProtectedRoute