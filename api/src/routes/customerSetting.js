// src/routes/customerSetting.js
const router = require('express').Router();
const multer = require('multer');
const { verifyToken } = require('../middleware/authMiddleware');
const ctrl = require('../controllers/customerSettingController');

// Customers live in mt_user_account, staff live in users, and the two tables
// share an id space. A staff token must never reach these handlers or it would
// read/write the mt_user_account row that happens to share its id.
// authController puts `portal` on every token, so gate on it explicitly.
const requireCustomer = (req, res, next) => {
  if (req.user?.portal !== 'customer') {
    return res.status(403).json({ message: 'Customer account required' });
  }
  next();
};

// multer rejects (size/type) surface as thrown errors, which would otherwise
// bubble to the generic 500 handler and tell the user nothing useful.
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Image must be 2MB or smaller' });
    }
    return res.status(400).json({ message: 'Upload failed. Please try again.' });
  }
  if (err) {
    return res.status(400).json({ message: err.message || 'Upload failed' });
  }
  next();
};

// PROFILE
router.get('/profile', verifyToken, requireCustomer, ctrl.getMyProfile);
router.put('/profile', verifyToken, requireCustomer, ctrl.updateMyProfile);

// PROFILE PICTURE (multipart, field name "picture")
router.post(
  '/profile/picture',
  verifyToken,
  requireCustomer,
  ctrl.avatarUpload.single('picture'),
  handleUploadErrors,
  ctrl.uploadMyPicture
);
router.delete('/profile/picture', verifyToken, requireCustomer, ctrl.deleteMyPicture);

// PASSWORD
router.put('/password', verifyToken, requireCustomer, ctrl.updateMyPassword);

module.exports = router;