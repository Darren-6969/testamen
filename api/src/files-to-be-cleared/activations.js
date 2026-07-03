const router = require('express').Router();
const ctrl = require('../controllers/activationController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { verifyToken } = require('../middleware/authMiddleware');

// Ensure upload folder exists (absolute path)
const uploadDir = path.join(__dirname, '..', 'uploads', 'activation_images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config: keep original extension
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // get original extension
    const name = `${file.fieldname}-${Date.now()}${ext}`; // e.g., image_1-1699999999999.jpg
    cb(null, name);
  },
});

const upload = multer({ storage });

// ============================================================================
//                               ROUTES
// ============================================================================

// Fetch all activations (list view)
router.get('/', verifyToken, ctrl.getActivations);

// Fetch activations with cursor pagination for frontend table listing
router.get('/list', verifyToken, ctrl.getActivationsCursor);

// ---- Get all customers for datalist ----
// IMPORTANT: this must be BEFORE "/:id" so it’s not matched as an :id route.
router.get('/customers/list', verifyToken, ctrl.getCustomers);

// Fetch activation by ID (view details)
router.get('/:id', verifyToken, ctrl.getActivationById);

// Create new activation record with file upload
router.post(
  '/add',
  verifyToken,
  upload.fields([
    { name: 'image_1', maxCount: 1 },
    { name: 'image_2', maxCount: 1 },
    { name: 'image_3', maxCount: 1 },
  ]),
  ctrl.createActivation
);

// Update activation record (e.g., mark as installed or edit details)
// router.put('/:id', verifyToken, ctrl.updateActivation);
router.put(
  '/:id',
  verifyToken,
  upload.fields([
    { name: 'image_1', maxCount: 1 },
    { name: 'image_2', maxCount: 1 },
    { name: 'image_3', maxCount: 1 },
  ]),
  ctrl.updateActivation
);


// Delete SINGLE image (image_1 / image_2 / image_3)
router.delete(
  '/:id/image/:fieldName',
  verifyToken,
  ctrl.deleteActivationImage
);

// Delete activation (soft delete)
router.delete('/:id', verifyToken, ctrl.deleteActivation);


module.exports = router;
