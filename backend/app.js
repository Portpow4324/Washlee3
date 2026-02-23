require('dotenv').config()

const express = require('express')
const cors = require('cors')
const adminRoutes = require('./routes/admin.routes')
const paymentRoutes = require('./routes/payments.routes')
const webhookRoutes = require('./routes/webhook.routes')
const { verifyFirebaseAuth } = require('./middleware/auth.middleware')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
)

// JSON parser - standard requests
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Webhook routes (must come before auth middleware)
app.use('/webhooks', webhookRoutes)

// Authentication middleware (required for all subsequent routes)
app.use(verifyFirebaseAuth)

// Admin routes
app.use('/admin', adminRoutes)

// Payment routes
app.use('/payments', paymentRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('[Error] Unhandled error:', err.message)
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`[Server] Washlee backend running on port ${PORT}`)
  console.log(`[Server] Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`)
  console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`)
})

module.exports = app
