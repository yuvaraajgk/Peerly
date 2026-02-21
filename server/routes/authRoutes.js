const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const authMiddleware = require('../middleware/authMiddleware')
const { validateSignup, validateLogin } = require('../middleware/validation')

// Legacy routes (kept for backward compatibility, but can be removed)
router.post('/signup', validateSignup, authController.signup)
router.post('/login', validateLogin, authController.login)
router.post('/verify-email', authController.verifyEmail)

// New Google OAuth routes
router.post('/google', authController.googleAuth)
router.post('/set-username', authController.setUsername)

router.get('/me', authMiddleware, authController.getMe)

module.exports = router
