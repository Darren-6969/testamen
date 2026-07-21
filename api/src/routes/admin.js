// src/routes/admin.js  (mount at /api/admin)
const router = require('express').Router();
const { verifyToken } = require('../middleware/authMiddleware');

const storage = require('../controllers/storageController');
const profile = require('../controllers/adminProfileController');
const media = require('../controllers/photoAlbumController');
const video = require('../controllers/videoController');
const approval = require('../controllers/approvalController');
const tribute = require('../controllers/tributeController');

const quota = require('../middleware/quotaMiddleware');
const { compressUploads } = require('../utils/mediaCompress');

const {
  profilePicUpload,
  cemeteryUpload,
  backgroundUpload,
  photoUpload,
  videoUpload,
} = require('../utils/memorialUpload');

router.use(verifyToken);

// Quota pipeline for routes that write countable bytes: preCheck -> uploader -> compressUploads -> enforce -> controller 
// preCheck must precede the uploader (it clamps multer's per-file limit to the remaining quota); enforce must follow compressUploads (it charges the
// post-compression size). See utils/storageQuota.js for what counts.
const withQuota = (uploader) => [quota.preCheck, uploader, compressUploads, quota.enforce];

// storage (account-level)
router.get('/storage', storage.getStorage);

// main page: profile + cemetery
router.get('/profile/:memorialId', profile.getProfile);
router.post('/profile/save', profile.saveProfile);
// NOT quota-gated: writes mt_profile.profile_pic, which has no size column and
// is not counted by storageQuota. Still compressed.
router.post('/profile/photo', profilePicUpload, compressUploads, profile.uploadProfilePic);
router.get('/cemetery/:memorialId', profile.listCemetery);
router.post('/cemetery/upload', ...withQuota(cemeteryUpload), profile.uploadCemetery);
router.delete('/cemetery/:id', profile.deleteCemetery);

// background music library (global catalogue; read-only for the customer side)
router.get('/bgm', profile.getBgmOptions);

// photos & albums
router.get('/background/:memorialId', media.listBackgrounds);
router.post('/background/upload', ...withQuota(backgroundUpload), media.uploadBackgrounds);
router.patch('/background/:id/active', media.setActiveBackground);
router.delete('/background/:id', media.deleteBackground);
router.get('/albums/:memorialId', media.listAlbums);
router.post('/albums/create', media.createAlbum);
router.patch('/albums/:id', media.updateAlbum);
router.post('/albums/link', media.addPhotosToAlbum);
router.post('/albums/unlink', media.removePhotosFromAlbum);
router.get('/photos/:memorialId', media.listPhotos);
router.post('/photos/upload', ...withQuota(photoUpload), media.uploadPhotos);
router.delete('/photos/:id', media.deletePhoto);

// videos & audios
router.get('/videos/:memorialId', video.listVideos);
router.post('/videos/upload', ...withQuota(videoUpload), video.uploadVideos);
router.delete('/videos/:id', video.deleteVideo);

// approval
router.get('/approval/:memorialId', approval.listPending);
router.patch('/approval/:compositeId', approval.decide);

// tributes
router.get('/tributes/:memorialId', tribute.listTributes);
router.delete('/tributes/:id', tribute.deleteTribute);

module.exports = router;