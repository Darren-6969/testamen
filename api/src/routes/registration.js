const router = require("express").Router();
const ctrl = require("../controllers/registrationController");
const memorialUrlCtrl = require("../controllers/memorialUrlController");
const registerMedia = require("../controllers/registerMediaController");
const adminProfile = require("../controllers/adminProfileController");
const { verifyToken } = require("../middleware/authMiddleware");
const { profilePicUpload } = require("../utils/memorialUpload");
const { compressUploads } = require("../utils/mediaCompress");

// ---------------------------------------------------------------------------
// Public registration funnel (landing page). No auth: these all sit ahead of
// account creation.
//
// ORDER MATTERS: the literal GET paths are declared before '/:id'. Express
// matches in declaration order, so putting them after would let the '/:id'
// param route swallow the request and return "Invalid ID".
// ---------------------------------------------------------------------------

// Step 1 - live memorial URL availability hint.
router.get('/url-available', memorialUrlCtrl.checkWebUrl);

// Step 2 - background music catalogue. Same handler the authenticated admin
// module uses (GET /api/admin/bgm); it reads the global mt_bgm catalogue and
// never touches req.user, so it is safe to expose unauthenticated rather than
// duplicating the query.
router.get('/bgm', adminProfile.getBgmOptions);

// Step 2 - profile picture, uploaded now and referenced by filename at commit.
// Same uploader and compression as the authenticated admin route, so the limits
// cannot drift apart: 1 image, 8 MB, jpeg/jpg/png/webp/gif.
router.post(
  '/profile-photo',
  profilePicUpload,
  compressUploads,
  registerMedia.stageProfilePhoto
);

// Step 3 - inline availability checks. Advisory only; publicRegister re-checks
// both inside its transaction.
router.get('/email-available', memorialUrlCtrl.checkEmail);
router.get('/username-available', memorialUrlCtrl.checkUsername);

// Step 3 - the single write for the entire funnel.
router.post('/public/register', ctrl.publicRegister);

// ---------------------------------------------------------------------------
// Back-office registration management.
// ---------------------------------------------------------------------------
router.get('/list', verifyToken, ctrl.getAllRegistrations);
router.get('/:id', verifyToken, ctrl.getRegistration);
router.put('/:id', verifyToken, ctrl.updateRegistration);
router.delete('/:id', verifyToken, ctrl.deleteRegistration);

module.exports = router;