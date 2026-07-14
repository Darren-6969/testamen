// src/utils/memorialUpload.js
// Multer upload config for the Admin (memorial content) module.
// Files land under api/uploads/memorial/<subfolder>/ and are served at
// /api/uploads/memorial/<subfolder>/<filename> (see index.js static route).

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

function makeUploader(subfolder, mimeTypes, field, maxCount, sizeMb) {
  const dest = path.join(ROOT, subfolder);
  ensure(dest);

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensure(dest);
      cb(null, dest);
    },
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${sanitize(file.originalname)}`),
  });

  const fileFilter = (_req, file, cb) =>
    mimeTypes.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Unsupported file type'), false);

  return multer({ storage, fileFilter, limits: { fileSize: (sizeMb || 8) * 1024 * 1024 } }).array(
    field,
    maxCount
  );
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