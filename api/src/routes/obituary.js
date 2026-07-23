// src/routes/obituary.js
const router = require("express").Router();
const ctrl = require("../controllers/obituaryController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post('/save', verifyToken, ctrl.saveObituary);

router.post(
  '/upload-image',
  verifyToken,
  ctrl.obituaryImageUpload.single('image'),
  ctrl.uploadObituaryImage
);

router.post('/generate-pdf/:memorialId', verifyToken, ctrl.generateObituaryPdf);
router.get('/by-memorial/:memorialId', verifyToken, ctrl.getObituaryByMemorial);
router.get('/list', verifyToken, ctrl.getObituary);
router.get('/:id', verifyToken, ctrl.getObituaryById);
router.delete('/:id', verifyToken, ctrl.deleteObituary);

module.exports = router;