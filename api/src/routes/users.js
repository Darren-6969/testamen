const router = require('express').Router();
const ctrl   = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/', verifyToken, ctrl.getAllUsers);
router.get('/modulelist', verifyToken, ctrl.getUserModules);
// router.get('/:id', ctrl.getUserById);
// router.post('/',   ctrl.createUser);
// router.put('/:id', ctrl.updateUser);
// router.delete('/:id', ctrl.deleteUser);
router.get('/check-username', ctrl.checkUsernameExists);

module.exports = router;
