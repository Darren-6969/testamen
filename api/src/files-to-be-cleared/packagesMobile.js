// src/routes/packagesMobile.js
const router = require("express").Router();
const ctrl = require("../controllers/packagesMobileController");
const { verifyToken } = require("../middleware/authMiddleware");

// final: GET /api/packages/mobile
router.get("/", verifyToken, ctrl.getPackages);

// optional
router.get("/list", verifyToken, ctrl.listPackages);

// Current user's package (Subscription page)
router.get("/current", verifyToken, ctrl.getCurrentPackage);

module.exports = router;
