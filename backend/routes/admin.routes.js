const express = require('express')
const router = express.Router()
const {
  getPendingPaymentUsers,
  getActiveSubscriptionUsers,
  getWashClubUsers,
  getEmployeeUsers,
  getCustomerOnlyUsers,
  getUser,
  confirmPayment,
  rejectPayment,
} = require('../services/firebaseService')
const { requireAdmin } = require('../middleware/auth.middleware')

/**
 * GET /admin/users/pending-payments
 * Get all users with pending payments
 */
router.get('/users/pending-payments', requireAdmin, async (req, res) => {
  try {
    console.log(`[Admin] Fetching pending payment users by admin ${req.user.uid}`)
    const users = await getPendingPaymentUsers()

    res.json({
      count: users.length,
      users: users,
    })
  } catch (error) {
    console.error('[Admin] Error fetching pending payment users:', error.message)
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message,
    })
  }
})

/**
 * GET /admin/users/subscriptions
 * Get all users with active subscriptions
 */
router.get('/users/subscriptions', requireAdmin, async (req, res) => {
  try {
    console.log(`[Admin] Fetching active subscription users by admin ${req.user.uid}`)
    const users = await getActiveSubscriptionUsers()

    res.json({
      count: users.length,
      users: users,
    })
  } catch (error) {
    console.error('[Admin] Error fetching subscription users:', error.message)
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message,
    })
  }
})

/**
 * GET /admin/users/wash-club
 * Get all wash club (loyalty) members
 */
router.get('/users/wash-club', requireAdmin, async (req, res) => {
  try {
    console.log(`[Admin] Fetching wash club members by admin ${req.user.uid}`)
    const users = await getWashClubUsers()

    res.json({
      count: users.length,
      users: users,
    })
  } catch (error) {
    console.error('[Admin] Error fetching wash club users:', error.message)
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message,
    })
  }
})

/**
 * GET /admin/users/employees
 * Get all employees
 */
router.get('/users/employees', requireAdmin, async (req, res) => {
  try {
    console.log(`[Admin] Fetching employees by admin ${req.user.uid}`)
    const users = await getEmployeeUsers()

    res.json({
      count: users.length,
      users: users,
    })
  } catch (error) {
    console.error('[Admin] Error fetching employee users:', error.message)
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message,
    })
  }
})

/**
 * GET /admin/users/customers-only
 * Get customers only (no subscriptions, no loyalty, not employees)
 */
router.get('/users/customers-only', requireAdmin, async (req, res) => {
  try {
    console.log(`[Admin] Fetching customers-only users by admin ${req.user.uid}`)
    const users = await getCustomerOnlyUsers()

    res.json({
      count: users.length,
      users: users,
    })
  } catch (error) {
    console.error('[Admin] Error fetching customers-only users:', error.message)
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error.message,
    })
  }
})

/**
 * POST /admin/users/:uid/confirm-payment
 * Manually confirm a payment (admin override)
 */
router.post('/users/:uid/confirm-payment', requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params
    const adminUID = req.user.uid

    console.log(`[Admin] Confirming payment for user ${uid} by admin ${adminUID}`)

    // Verify user exists
    const user = await getUser(uid)
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      })
    }

    const updatedUser = await confirmPayment(uid, adminUID)

    res.json({
      message: 'Payment confirmed successfully',
      user: updatedUser,
    })
  } catch (error) {
    console.error('[Admin] Error confirming payment:', error.message)
    res.status(500).json({
      error: 'Failed to confirm payment',
      message: error.message,
    })
  }
})

/**
 * POST /admin/users/:uid/reject-payment
 * Reject/reset a payment (admin override)
 */
router.post('/users/:uid/reject-payment', requireAdmin, async (req, res) => {
  try {
    const { uid } = req.params

    console.log(`[Admin] Rejecting payment for user ${uid} by admin ${req.user.uid}`)

    // Verify user exists
    const user = await getUser(uid)
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      })
    }

    const updatedUser = await rejectPayment(uid)

    res.json({
      message: 'Payment rejected successfully',
      user: updatedUser,
    })
  } catch (error) {
    console.error('[Admin] Error rejecting payment:', error.message)
    res.status(500).json({
      error: 'Failed to reject payment',
      message: error.message,
    })
  }
})

module.exports = router
