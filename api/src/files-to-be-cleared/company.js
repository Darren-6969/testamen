const router = require('express').Router();
const ctrl   = require('../controllers/companyController');
// const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', ctrl.getCompanyProfile);

module.exports = router;