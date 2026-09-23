require('dotenv').config()

const http = require('http')
const { Server } = require('socket.io')

const app = require('./app')
const connectDatabase = require('./config/database')
const { setSocketIO } = require('./services/socket')

const PORT = process.env.PORT || 5000

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5175',
    methods: ['GET', 'POST'],
  },
})

setSocketIO(io)

// Track active socket connections per user.
// This supports multiple tabs/devices correctly.
const onlineUsers = new Map()

const getOnlineUserIds = () => {
  return Array.from(onlineUsers.keys())
}

io.on('connection', (socket) => {
  console.log(
    `Socket connected: ${socket.id}`,
  )

  // Send current online users whenever
  // a client requests the latest presence list.
  socket.on('get_online_users', () => {
    socket.emit('online_users', {
      userIds: getOnlineUserIds(),
    })

    console.log(
      `Sent online users to socket ${socket.id}`,
    )
  })

  socket.on('join', (userId) => {
    if (!userId) {
      return
    }

    socket.userId = userId
    socket.join(`user:${userId}`)

    const currentConnections =
      onlineUsers.get(userId) || 0

    onlineUsers.set(
      userId,
      currentConnections + 1,
    )

    // Send the complete current online-user list
    // to the newly connected client.
    socket.emit('online_users', {
      userIds: getOnlineUserIds(),
    })

    // Only announce online when the first
    // connection for this user appears.
    if (currentConnections === 0) {
      io.emit('user_online', {
        userId,
      })
    }

    console.log(
      `User ${userId} joined socket room user:${userId} (${currentConnections + 1} connection(s))`,
    )
  })

  socket.on(
    'typing',
    ({ senderId, receiverId }) => {
      if (!senderId || !receiverId) {
        return
      }

      socket
        .to(`user:${receiverId}`)
        .emit('user_typing', {
          senderId,
        })
    },
  )

  socket.on(
    'stop_typing',
    ({ senderId, receiverId }) => {
      if (!senderId || !receiverId) {
        return
      }

      socket
        .to(`user:${receiverId}`)
        .emit('user_stop_typing', {
          senderId,
        })
    },
  )

  socket.on('disconnect', () => {
    const userId = socket.userId

    if (userId) {
      const currentConnections =
        onlineUsers.get(userId) || 0

      const remainingConnections =
        Math.max(currentConnections - 1, 0)

      if (remainingConnections === 0) {
        onlineUsers.delete(userId)

        io.emit('user_offline', {
          userId,
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