const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { register, login, changePassword, refreshToken,logout,forgotPassword,resetPassword } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/change-password', verifyToken, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/logout', verifyToken, logout);

module.exports = router;
