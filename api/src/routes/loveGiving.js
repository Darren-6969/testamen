// src/routes/loveGiving.js
const router = require('express').Router();
const ctrl = require('../controllers/loveGivingController');
const { verifyToken } = require('../middleware/authMiddleware');

// Upsert the love-giving bank details for the active memorial
router.post('/save', verifyToken, ctrl.saveLoveGiving);

// Load the love-giving details for a memorial (returns null if not set yet)
router.get('/by-memorial/:memorialId', verifyToken, ctrl.getLoveGivingByMemorial);

module.exports = router;