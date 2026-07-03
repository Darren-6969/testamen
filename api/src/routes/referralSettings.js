const express = require('express');
const router = express.Router();

const {
  getReferralSettings,
  updateReferralSettings,
} = require('../controllers/referralSettingsController');

/**
 * GET /api/referral-settings
 * Get current referral settings
 */
router.get('/', getReferralSettings);

/**
 * PUT /api/referral-settings
 * Update referral settings
 */
router.put('/', updateReferralSettings);

module.exports = router;