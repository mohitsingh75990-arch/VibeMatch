import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import socket from '../services/socket'

const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const storedUser =
        localStorage.getItem('vibematch_user')

      return storedUser
        ? JSON.parse(storedUser)
        : null
    } catch {
      localStorage.removeItem('vibematch_user')
      return null
    }
  })

  const [token, setToken] = useState(() =>
    localStorage.getItem('vibematch_token'),
  )

  const login = (userData, authToken) => {
    if (!authToken) {
      console.error(
        'VibeMatch login failed: authentication token missing.',
      )

      return false
    }

    if (!userData) {
      console.error(
        'VibeMatch login failed: user data missing.',
      )

      return false
    }

    localStorage.setItem(
      'vibematch_user',
      JSON.stringify(userData),
    )

    localStorage.setItem(
      'vibematch_token',
      authToken,
    )

    setUser(userData)
    setToken(authToken)

    return true
  }

  const logout = () => {
    console.log('🔴 VibeMatch logout')

    socket.disconnect()

    localStorage.removeItem('vibematch_user')
    localStorage.removeItem('vibematch_token')

    setUser(null)
    setToken(null)
  }

  useEffect(() => {
    console.log(
      '🔵 Socket effect user:',
      user,
    )

    if (!user?.id) {
      console.log(
        '⚪ No logged-in user. Socket disconnected.',
      )

      socket.disconnect()
      return
    }

    const handleConnect = () => {
      console.log(
        '🟢 VibeMatch socket connected:',
        socket.id,
      )

      socket.emit('join', user.id)

      console.log(
        '👤 VibeMatch user joined:',
        user.id,
      )
    }

    const handleConnectError = (error) => {
      console.error(
        '🔴 Socket connection error:',
        error.message,
      )
    }

    const handleDisconnect = (reason) => {
      console.log(
        '⚪ Socket disconnected:',
        reason,
      )
    }

    socket.on(
      'connect',
      handleConnect,
    )

    socket.on(
      'connect_error',
      handleConnectError,
    )

    socket.on(
      'disconnect',
      handleDisconnect,
    )

    console.log(
      '🔄 Starting VibeMatch socket connection...',
    )

    if (!socket.connected) {
      socket.connect()
    } else {
      handleConnect()
    }

    return () => {
      socket.off(
        'connect',
        handleConnect,
      )

      socket.off(
        'connect_error',
        handleConnectError,
      )

      socket.off(
        'disconnect',
        handleDisconnect,
      )

      socket.disconnect()
    }
  }, [user?.id])

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    login,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

function useAuth() {
  return useContext(AuthContext)
}

export { AuthProvider, useAuth }