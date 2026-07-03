const router = require('express').Router();
const ctrl = require('../controllers/packageController');
const { verifyToken } = require('../middleware/authMiddleware');

// Fetch all packages (list view)
router.post('/', verifyToken, ctrl.getPackages);

// Fetch package by ID (view details)
router.get('/:id(\\d+)', verifyToken, ctrl.getPackageById);

// ---- New route: Get all packages for datalist ----
router.get('/list', verifyToken, async (req, res) => {
  try {
    const result = await ctrl.getPackages(); // Implement in your controller
    res.json(result);
  } catch (err) {
    console.error('Error fetching packages:', err);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// Create new package
router.post('/add', verifyToken, ctrl.createPackage);

// Update package
router.put('/:id(\\d+)', verifyToken, ctrl.updatePackage);

// Delete package
router.delete('/:id(\\d+)', verifyToken, ctrl.deletePackage);

module.exports = router;
