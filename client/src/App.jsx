import { Route, Routes } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Discover from './pages/Discover'
import Profile from './pages/Profile'
import Matches from './pages/Matches'
import Chat from './pages/Chat'
import Notifications from './pages/Notifications'
import BlockedUsers from './pages/BlockedUsers'
import MyReports from './pages/MyReports'
import Safety from './pages/Safety'
import Settings from './pages/Settings'

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/discover" element={<Discover />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/chat/:userId" element={<Chat />} />
          <Route
            path="/notifications"
            element={<Notifications />}
          />
          <Route
            path="/blocked-users"
            element={<BlockedUsers />}
          />
          <Route
            path="/my-reports"
            element={<MyReports />}
          />
          <Route path="/safety" element={<Safety />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App