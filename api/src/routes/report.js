// src/routes/audit.js
const router = require("express").Router();
const ctrl = require("../controllers/reportController");
const { verifyToken } = require("../middleware/authMiddleware");


router.get('/list',verifyToken,ctrl.getReport);


module.exports = router;