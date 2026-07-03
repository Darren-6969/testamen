const router = require('express').Router();
const ctrl   = require('../controllers/packageController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, ctrl.getAllPackages);
router.get('/:id', verifyToken, ctrl.viewPackage);
// router.get('/modulelist', verifyToken, ctrl.getPacakgeModules);
// router.get('/:id', ctrl.getUserById);
// router.post('/',   ctrl.createUser);
// router.put('/:id', ctrl.updateUser);
// router.delete('/:id', ctrl.deleteUser);

module.exports = router;
