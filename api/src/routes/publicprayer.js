const express = require('express');
const router = express.Router();

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
router.get('/', getPublicPrayers);
router.get('/:id', getPublicPrayerById);
router.post('/', createPublicPrayer);
router.put('/:id', updatePublicPrayer);
router.delete('/:id', deletePublicPrayer);

module.exports = router;