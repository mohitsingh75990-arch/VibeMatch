require('dotenv').config()

const http = require('http')
const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')

const app = require('./app')
const connectDatabase = require('./config/database')
const { setSocketIO } = require('./services/socket')
const User = require('./models/User')

const PORT = process.env.PORT || 5000

const server = http.createServer(app)

const { allowedOrigins } = require('./config/cors')

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

setSocketIO(io)

const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token

    if (!token) {
      return next(new Error('Authentication required'))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    socket.userId = decoded.userId
    next()
  } catch (error) {
    next(new Error('Invalid or expired token'))
  }
}

io.use(authenticateSocket)

// Track active socket connections per user.
// This supports multiple tabs/devices correctly.
const onlineUsers = new Map()

const getOnlineUserIds = () => {
  return Array.from(onlineUsers.keys())
}

io.on('connection', (socket) => {
  console.log(
    `Socket connected: ${socket.id} (user: ${socket.userId})`,
  )

  const userId = socket.userId

  socket.join(`user:${userId}`)

  User.findByIdAndUpdate(userId, { lastSeen: new Date() }).catch((err) => {
    console.error('Error updating lastSeen on join:', err.message)
  })

  const currentConnections =
    onlineUsers.get(userId) || 0

  onlineUsers.set(
    userId,
    currentConnections + 1,
  )

  socket.emit('online_users', {
    userIds: getOnlineUserIds(),
  })

  if (currentConnections === 0) {
    io.emit('user_online', {
      userId,
    })
  }

  console.log(
    `User ${userId} joined socket room user:${userId} (${currentConnections + 1} connection(s))`,
  )

  socket.on('get_online_users', () => {
    socket.emit('online_users', {
      userIds: getOnlineUserIds(),
    })

    console.log(
      `Sent online users to socket ${socket.id}`,
    )
  })

  socket.on(
    'typing',
    ({ receiverId }) => {
      if (!receiverId) {
        return
      }

      socket
        .to(`user:${receiverId}`)
        .emit('user_typing', {
          senderId: userId,
        })
    },
  )

  socket.on(
    'stop_typing',
    ({ receiverId }) => {
      if (!receiverId) {
        return
      }

      socket
        .to(`user:${receiverId}`)
        .emit('user_stop_typing', {
          senderId: userId,
        })
    },
  )

  socket.on('disconnect', () => {
    const currentConnections =
      onlineUsers.get(userId) || 0

    const remainingConnections =
      Math.max(currentConnections - 1, 0)

    if (remainingConnections === 0) {
      onlineUsers.delete(userId)
      const lastSeen = new Date()

      io.emit('user_offline', {
        userId,
        lastSeen: lastSeen.toISOString(),
      })

      User.findByIdAndUpdate(userId, { lastSeen }).catch((err) => {
        console.error('Error updating lastSeen on disconnect:', err.message)
      })

      console.log(
        `User ${userId} went offline`,
      )
    } else {
      onlineUsers.set(
        userId,
        remainingConnections,
      )

      console.log(
        `User ${userId} still has ${remainingConnections} connection(s)`,
      )
    }

    console.log(
      `Socket disconnected: ${socket.id}`,
    )
  })
})

connectDatabase()

server.listen(PORT, () => {
  console.log(
    `VibeMatch API running on http://localhost:${PORT}`,
  )
})