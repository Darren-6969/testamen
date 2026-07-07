const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');

const {
  getPublicPrayers,
  getPublicPrayerById,
  createPublicPrayer,
  updatePublicPrayer,
  deletePublicPrayer,
} = require('../controllers/publicPrayerController');

/**
 * Public Prayer Routes
 */
router.get('/', verifyToken, getPublicPrayers);
router.get('/:id', verifyToken, getPublicPrayerById);
router.post('/', verifyToken, createPublicPrayer);
router.put('/:id', verifyToken, updatePublicPrayer);
router.delete('/:id', verifyToken, deletePublicPrayer);

module.exports = router;