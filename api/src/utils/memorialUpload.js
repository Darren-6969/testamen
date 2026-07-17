// src/utils/memorialUpload.js
// Multer upload config for the Admin (memorial content) module.
// Files land under api/uploads/memorial/<subfolder>/ and are served at
// /api/uploads/memorial/<subfolder>/<filename> (see index.js static route).
//
// PLAN-AWARE LIMITS
//
// The exported values are now middleware FACTORIES that build multer per request
// and clamp fileSize to whatever the account actually has left. Multer stops
// reading mid-stream, so an oversized file never fully arrives.
//
// Requires quotaMiddleware.preCheck to have populated req.storageQuota. If it
// has not (a route that is not quota-gated), the configured maximum applies and
// behaviour is exactly as before.
//
// NOTE ON PARTIAL ACCEPT: multer aborts the WHOLE request when fileSize is
// exceeded — it cannot skip one file and keep the others. So a single
// over-remaining file fails the request rather than being silently dropped.

const fs = require('fs');
const path = require('path');
const multer = require('multer');

const ROOT = path.join(__dirname, '..', '..', 'uploads', 'memorial');

const ensure = (p) => {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
};

const sanitize = (name) =>
  name
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9.\-_]/g, '')
    .toLowerCase();

function makeStorage(subfolder) {
  const dest = path.join(ROOT, subfolder);
  ensure(dest);
  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensure(dest);
      cb(null, dest);
    },
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${sanitize(file.originalname)}`),
  });
}

function makeFilter(mimeTypes) {
  return (_req, file, cb) =>
    mimeTypes.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Unsupported file type'), false);
}

/**
 * Returns Express middleware that builds a multer instance per request, with
 * fileSize clamped to min(configured cap, remaining quota).
 */
function makeUploader(subfolder, mimeTypes, field, maxCount, sizeMb) {
  const configuredMax = (sizeMb || 8) * 1024 * 1024;
  const storage = makeStorage(subfolder);
  const fileFilter = makeFilter(mimeTypes);

  return (req, res, next) => {
    const remaining = req.storageQuota?.remainingBytes;

    // Math.max(1, ...) because multer treats a 0 limit as "reject everything"
    // with a confusing error. preCheck already 413s when remaining is 0, so this
    // is only a guard against a route that skipped it.
    const fileSize =
      typeof remaining === 'number'
        ? Math.max(1, Math.min(configuredMax, remaining))
        : configuredMax;

    const upload = multer({
      storage,
      fileFilter,
      limits: { fileSize },
    }).array(field, maxCount);

    upload(req, res, (err) => {
      if (!err) return next();

      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        const q = req.storageQuota;
        const capMb = Math.round((fileSize / (1024 * 1024)) * 10) / 10;

        // Distinguish "too big for your plan" from "too big, full stop" — the
        // first should promote an upgrade, the second should not.
        const clampedByQuota = typeof remaining === 'number' && remaining < configuredMax;

        return res.status(413).json(
          clampedByQuota
            ? {
                status: 'error',
                code: 'STORAGE_QUOTA_EXCEEDED',
                plan: q?.plan,
                usedMb: q?.usedMb,
                totalMb: q?.totalMb,
                remainingMb: q?.remainingMb,
                message: `That file is larger than your remaining storage (${capMb} MB free on your ${q?.plan} plan). Upgrade or remove some files first.`,
              }
            : {
                status: 'error',
                message: `Each file must be ${capMb} MB or smaller.`,
              }
        );
      }

      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_COUNT') {
        return res
          .status(400)
          .json({ status: 'error', message: `You can upload at most ${maxCount} files at a time.` });
      }

      return res
        .status(400)
        .json({ status: 'error', message: err.message || 'Upload failed' });
    });
  };
}

const IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const AV_MIMES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
];

// URL a Next.js frontend can load (proxied through the /api/* rewrite)
const mediaUrl = (subfolder, filename) =>
  filename ? `/api/uploads/memorial/${subfolder}/${filename}` : null;

// absolute path on disk (for deletes)
const diskPath = (subfolder, filename) => path.join(ROOT, subfolder, filename);

module.exports = {
  photoUpload: makeUploader('photos', IMAGE_MIMES, 'files', 10, 8),
  backgroundUpload: makeUploader('backgrounds', IMAGE_MIMES, 'files', 5, 8),
  cemeteryUpload: makeUploader('cemetery', IMAGE_MIMES, 'files', 3, 8),
  profilePicUpload: makeUploader('profile', IMAGE_MIMES, 'files', 1, 8),
  videoUpload: makeUploader('videos', AV_MIMES, 'files', 5, 100),
  mediaUrl,
  diskPath,
};