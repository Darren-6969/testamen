// src/routes/obituary.js
const router = require("express").Router();
const ctrl = require("../controllers/obituaryController");
const { verifyToken } = require("../middleware/authMiddleware");


// NOTE: '/list' must stay registered before '/:id', otherwise '/:id' would swallow the '/list' request (with id === "list").
router.get('/list', verifyToken, ctrl.getObituary);
router.get('/:id', verifyToken, ctrl.getObituaryById);


module.exports = router;