// src/routes/audit.js
const router = require("express").Router();
const ctrl = require("../controllers/deceasedController");
const { verifyToken } = require("../middleware/authMiddleware");


router.get('/list',verifyToken,ctrl.getDeceased);
router.delete('/:id', verifyToken, ctrl.softDeleteDeceased);

module.exports = router;