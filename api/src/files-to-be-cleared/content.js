const router = require('express').Router();
const path = require('path');
const multer = require('multer');

const ctrl   = require('../controllers/contentController');
const { verifyToken } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'content_images'));
  },
  filename: (req, file, cb) => {
    // keep extension from original file
    const ext = path.extname(file.originalname); // e.g. ".jpg"
    const baseName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, baseName + ext); // e.g. "17124901923-123456789.jpg"
  }
});

const upload = multer({ storage });

// ============================================================================
//                                 Routes
// ============================================================================

// List / filtered content (JSON body with optional "fields")
router.post('/', verifyToken, ctrl.getContent);

// Get single content by ID (for edit page)
router.get('/:id', verifyToken, ctrl.getContentById);

// Add content (multipart/form-data with image)
router.post(
  '/add',
  verifyToken,
  upload.single('image'),   // field name from form
  ctrl.addContent
);

// Update content (multipart/form-data with optional new image)
router.put(
  '/:id',
  verifyToken,
  upload.single('image'),
  ctrl.updateContent
);

// NEW: delete image for a specific content record
router.delete('/:id/image', verifyToken, ctrl.deleteContentImage);

// Soft delete content (set status = 'Inactive')
router.delete('/:id', verifyToken, ctrl.softDeleteContent);

module.exports = router;