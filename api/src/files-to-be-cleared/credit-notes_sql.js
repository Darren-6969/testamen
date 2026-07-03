const router = require('express').Router();
const ctrl = require('../controllers/creditNoteController_sql');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/sql/credit-notes?limit=20&cursor=...
router.get('/', verifyToken, ctrl.getAllCreditNotes);

module.exports = router;
