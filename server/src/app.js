const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')

const { corsOptions } = require('./config/cors')
const authRoutes = require('./routes/auth.routes')
const userRoutes = require('./routes/user.routes')
const interactionRoutes = require('./routes/interaction.routes')
const matchRoutes = require('./routes/match.routes')
const messageRoutes = require('./routes/message.routes')
const compatibilityRoutes = require('./routes/compatibility.routes')
const musicRoutes = require('./routes/music.routes')
const musicCompatibilityRoutes = require('./routes/musicCompatibility.routes')
const notificationRoutes = require('./routes/notification.routes')
const notificationPreferenceRoutes =
  require('./routes/notificationPreference.routes')
const blockRoutes = require('./routes/block.routes')
const reportRoutes = require('./routes/report.routes')
const aiRoutes = require('./routes/ai.routes')

const app = express()

// Production-safe security headers with helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  }),
)

// Explicit CORS origin restriction
app.use(cors(corsOptions))
app.use(express.json())

// Serve uploaded profile images
app.use(
  '/uploads',
  express.static(path.join(__dirname, '../uploads')),
)

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/interactions', interactionRoutes)
app.use('/api/matches', matchRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/compatibility', compatibilityRoutes)
app.use('/api/music', musicRoutes)
app.use(
  '/api/music-compatibility',
  musicCompatibilityRoutes,
)
app.use('/api/notifications', notificationRoutes)
app.use(
  '/api/notification-preferences',
  notificationPreferenceRoutes,
)
app.use('/api/blocks', blockRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/ai', aiRoutes)

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'VibeMatch API is running',
  })
})

// Clean CORS rejection handler
app.use((err, req, res, next) => {
  if (err && err.message === 'CORS origin not allowed') {
    return res.status(403).json({
      success: false,
      message: 'CORS origin not allowed',
    })
  }
  next(err)
})

module.exports = app