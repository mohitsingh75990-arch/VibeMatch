import { io } from 'socket.io-client'

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api'

const SOCKET_URL = API_URL.replace(
  /\/api\/?$/,
  '',
)

const getToken = () => localStorage.getItem('vibematch_token')

const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  auth: () => {
    const token = getToken()
    return token ? { token } : {}
  },
})

export default socket