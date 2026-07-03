// src/routes/paymentMobile.js
const router = require('express').Router();
const ctrl = require('../controllers/paymentMobileController');
const { verifyToken } = require('../middleware/authMiddleware');

// ============================================================================
//                                 Routes
// ============================================================================

// List / filtered payment (JSON body with optional "fields")
router.post('/accounts', verifyToken, ctrl.getPaymentAccountsV2);

module.exports = router;