const router = require('express').Router();
const ctrl   = require('../controllers/deviceController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/search', verifyToken, ctrl.getAllDevices);
router.get('/:id', ctrl.getDeviceById);
router.post('/add', verifyToken, ctrl.createDevice);
router.put('/:id', verifyToken, ctrl.updateDevice);
router.delete('/:id', verifyToken, ctrl.deleteDevice);

module.exports = router;
