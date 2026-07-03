const express = require('express');
const router = express.Router();

const {
  uploadMiddleware,
  getBackgroundImages,
  uploadBackgroundImages,
  updateBackgroundImage,
  deleteBackgroundImage,
} = require('../controllers/backgroundImageController');

/**
 * GET /api/background-images
 * Get all background images
 */
router.get('/', getBackgroundImages);

/**
 * POST /api/background-images/upload
 * Upload desktop/mobile background images
 */
router.post('/upload', uploadMiddleware, uploadBackgroundImages);

/**
 * PATCH /api/background-images/:id
 * Update image order
 */
router.patch('/:id', updateBackgroundImage);

/**
 * DELETE /api/background-images/:id
 * Delete background image
 */
router.delete('/:id', deleteBackgroundImage);

module.exports = router;