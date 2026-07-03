// src/routes/authMobile.js
const express = require("express");
const router = express.Router();

const mobileAuth = require("../controllers/authMobileController");

// Mobile endpoints
router.post("/login", mobileAuth.login);
router.post("/refresh-token", mobileAuth.refreshToken);
// router.post("/forgot-password", mobileAuth.forgotPassword);
// router.post("/reset-password", mobileAuth.resetPassword);
router.post("/logout", mobileAuth.logout);

module.exports = router;
