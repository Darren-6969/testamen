// src/routes/audit.js
const router = require("express").Router();
const ctrl = require("../controllers/obituaryController");
const { verifyToken } = require("../middleware/authMiddleware");


router.get('/list',verifyToken,ctrl.getObituary);


module.exports = router;