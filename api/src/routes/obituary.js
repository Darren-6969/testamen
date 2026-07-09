// src/routes/obituary.js
const router = require("express").Router();
const ctrl = require("../controllers/obituaryController");
const { verifyToken } = require("../middleware/authMiddleware");

// --- Editor endpoints (must come BEFORE '/:id' so they aren't swallowed) ---

// Upsert obituary for the active memorial
router.post('/save', verifyToken, ctrl.saveObituary);

// Portrait image upload (multipart, field name "image")
router.post(
  '/upload-image',
  verifyToken,
  ctrl.obituaryImageUpload.single('image'),
  ctrl.uploadObituaryImage
);

// Generate / overwrite the PDF for a memorial's obituary
router.post('/generate-pdf/:memorialId', verifyToken, ctrl.generateObituaryPdf);

// Load an existing obituary for the editor
router.get('/by-memorial/:memorialId', verifyToken, ctrl.getObituaryByMemorial);

// --- Existing read endpoints ---
// NOTE: '/list' must stay registered before '/:id', otherwise '/:id' would
// swallow the '/list' request (with id === "list").
router.get('/list', verifyToken, ctrl.getObituary);
router.get('/:id', verifyToken, ctrl.getObituaryById);

module.exports = router;