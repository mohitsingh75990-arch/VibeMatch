import { Route, Routes } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'

const Discover = lazy(() => import('./pages/Discover'))
const Profile = lazy(() => import('./pages/Profile'))
const Matches = lazy(() => import('./pages/Matches'))
const Chat = lazy(() => import('./pages/Chat'))
const Notifications = lazy(() => import('./pages/Notifications'))
const BlockedUsers = lazy(() => import('./pages/BlockedUsers'))
const MyReports = lazy(() => import('./pages/MyReports'))
const Safety = lazy(() => import('./pages/Safety'))
const Settings = lazy(() => import('./pages/Settings'))

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />


        <Route element={<ProtectedRoute />}>
          <Route
            path="/discover"
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" /></div>}>
                <Discover />
              </Suspense>
            }
          />
          <Route
            path="/profile"
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" /></div>}>
                <Profile />
              </Suspense>
            }
          />
          <Route
            path="/matches"
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" /></div>}>
                <Matches />
              </Suspense>
            }
          />
          <Route
            path="/chat/:userId"
            element={
              <Suspense fallback={<div className="h-[calc(100vh-64px)] flex items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" /></div>}>
                <Chat />
              </Suspense>
            }
          />
          <Route
            path="/notifications"
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" /></div>}>
                <Notifications />
              </Suspense>
            }
          />
          <Route
            path="/blocked-users"
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" /></div>}>
                <BlockedUsers />
              </Suspense>
            }
          />
          <Route
            path="/my-reports"
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" /></div>}>
                <MyReports />
              </Suspense>
            }
          />
          <Route
            path="/safety"
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" /></div>}>
                <Safety />
              </Suspense>
            }
          />
          <Route
            path="/settings"
            element={
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" /></div>}>
                <Settings />
              </Suspense>
            }
          />
        </Route>
      </Route>
    </Routes>
  )
}

export default App