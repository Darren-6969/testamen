const router = require('express').Router();
const ctrl = require('../controllers/companyController_sql');

// GET /api/sql/company
router.get('/', ctrl.getCompanyProfile);

module.exports = router;
