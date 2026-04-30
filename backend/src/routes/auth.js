const express = require('express')
const { loginUser, uploadFile, registerUser, forgotPassword, resetPassword } = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')

const router = express.Router()

router.post('/login', loginUser)
router.post('/register', registerUser)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password/:token', resetPassword)
router.post('/upload', authenticate, uploadFile)

module.exports = router
