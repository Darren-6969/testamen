// src/routes/audit.js
const router = require("express").Router();
const ctrl = require("../controllers/billingController");
const { verifyToken } = require("../middleware/authMiddleware");


router.get('/list',verifyToken,ctrl.getBilling);


module.exports = router;