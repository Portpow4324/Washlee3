const { verifyFirebaseToken } = require('../services/firebaseService')

/**
 * Middleware: Verify Firebase token and attach user to request
 */
async function verifyFirebaseAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[Auth] Missing or invalid Authorization header')
      return res.status(401).json({
        error: 'Missing or invalid Authorization header',
      })
    }

    const token = authHeader.substring('Bearer '.length)
    const decodedToken = await verifyFirebaseToken(token)

    req.user = {
      uid: decodedToken.uid,
      isAdmin: decodedToken.admin === true,
      email: decodedToken.email,
    }

    console.log(`[Auth] User authenticated: ${req.user.uid} (admin: ${req.user.isAdmin})`)
    next()
  } catch (error) {
    console.error('[Auth] Token verification failed:', error.message)
    res.status(401).json({
      error: 'Unauthorized',
      message: error.message,
    })
  }
}

/**
 * Middleware: Require admin privileges
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'User not authenticated',
    })
  }

  if (!req.user.isAdmin) {
    console.warn(`[Auth] Non-admin user ${req.user.uid} attempted admin action`)
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin privileges required',
    })
  }

  console.log(`[Auth] Admin ${req.user.uid} authorized for action`)
  next()
}

module.exports = {
  verifyFirebaseAuth,
  requireAdmin,
}
