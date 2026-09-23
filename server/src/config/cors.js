const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ALLOWED_ORIGIN,
  'http://localhost:5173',
  'http://localhost:5175',
].filter(Boolean)

const corsOriginChecker = (origin, callback) => {
  // Allow requests with no origin (e.g. curl, mobile apps, server-to-server health checks)
  if (!origin) {
    return callback(null, true)
  }

  if (allowedOrigins.includes(origin)) {
    return callback(null, true)
  }

  return callback(new Error('CORS origin not allowed'))
}

const corsOptions = {
  origin: corsOriginChecker,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
}

module.exports = {
  allowedOrigins,
  corsOriginChecker,
  corsOptions,
}
