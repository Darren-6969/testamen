const express = require('express');
const router = express.Router();

const {
  getPlansStorage,
  updatePlansStorage,
} = require('../controllers/plansStorageController');

/**
 * GET /api/plans-storage
 * Fetch all plans and storage settings
 */
router.get('/', getPlansStorage);

/**
 * PUT /api/plans-storage
 * Update plans storage and pricing
 */
router.put('/', updatePlansStorage);

module.exports = router;