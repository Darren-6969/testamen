// src/utils/mediaCompress.js
//
// Shrinks uploaded images before they are charged to the storage quota.

const fs = require('fs');
const path = require('path');

// Resolved lazily so a missing dependency degrades instead of crashing boot.
let sharp = null;
try {
  sharp = require('sharp');
} catch (_) {
  console.warn('[mediaCompress] sharp not installed - image compression disabled.');
}

// Long edge cap. Well beyond any display size in the app, so this is invisible
// to users while removing the bulk of a modern phone photo's weight.
const MAX_EDGE = 2000;
const QUALITY = 82;

// GIF is excluded: sharp would flatten an animated GIF to a single frame.
const COMPRESSIBLE = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/jiff', 'image/jfif']);

const isCompressible = (file) => Boolean(sharp) && COMPRESSIBLE.has(file?.mimetype);

/**
 * Re-encode one image in place, preserving its format.
 * Keeps the result only if it is actually smaller — re-encoding an already
 * optimised file can make it bigger, and charging the user for that would be
 * worse than doing nothing.
 */
async function compressImageFile(file) {
  const ext = path.extname(file.path) || '.jpg';
  const tmp = `${file.path.slice(0, file.path.length - ext.length)}.tmp${ext}`;

  try {
    const pipeline = sharp(file.path)
      // Honour EXIF orientation, then strip metadata (also drops GPS coords).
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true });

    if (file.mimetype === 'image/png') {
      pipeline.png({ compressionLevel: 9, palette: true });
    } else if (file.mimetype === 'image/webp') {
      pipeline.webp({ quality: QUALITY });
    } else {
      pipeline.jpeg({ quality: QUALITY, mozjpeg: true });
    }

    await pipeline.toFile(tmp);

    const before = fs.statSync(file.path).size;
    const after = fs.statSync(tmp).size;

    if (after > 0 && after < before) {
      fs.renameSync(tmp, file.path);
      // multer captured the pre-compression size; the quota must count the file
      // that actually landed on disk, not the one that arrived on the wire.
      file.size = after;
      return { compressed: true, before, after };
    }

    fs.unlinkSync(tmp);
    return { compressed: false, before, after: before };
  } catch (err) {
    console.error('[mediaCompress] failed for', file.originalname, err.message);
    try {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    } catch (_) {
      /* nothing more we can do */
    }
    return { compressed: false };
  }
}

/**
 * Express middleware. Compresses every compressible file on req.files in place.
 *
 * MUST run after multer and BEFORE quotaMiddleware.enforce, so the quota is
 * charged on post-compression sizes.
 */
const compressUploads = async (req, res, next) => {
  const files = req.files || [];
  if (!files.length || !sharp) return next();

  try {
    for (const file of files) {
      if (isCompressible(file)) {
        await compressImageFile(file);
      }
    }
  } catch (err) {
    // Belt and braces: the per-file path already swallows its own errors.
    console.error('[mediaCompress] middleware error:', err);
  }

  return next();
};

module.exports = { compressUploads, compressImageFile, isCompressible };