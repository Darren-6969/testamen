// src/routes/audit.js
const router = require("express").Router();
const ctrl = require("../controllers/feedbackController");
const { verifyToken } = require("../middleware/authMiddleware");


router.get('/list',verifyToken,ctrl.getFeedback);


module.exports = router;