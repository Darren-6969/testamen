const router = require('express').Router();
const ctrl   = require('../controllers/staffController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, ctrl.getStaffs);
router.get('/list', verifyToken, ctrl.getStaffsCursor);
router.get('/modulelist', verifyToken, ctrl.getUserModules); // ✅ move above "/:id"
router.get('/:id', verifyToken, ctrl.getStaffById);
router.post('/technician/list', verifyToken, ctrl.getTechnicianList);

router.put('/:id', verifyToken, ctrl.updateStaff); // ✅ add verifyToken
router.patch('/:id/status', verifyToken, ctrl.updateStaffStatus); // ✅ add this

router.post('/add', verifyToken, ctrl.createStaff);

router.delete('/:id', verifyToken, ctrl.deleteStaff);

module.exports = router;
