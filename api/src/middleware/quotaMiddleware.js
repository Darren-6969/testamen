// src/middleware/quotaMiddleware.js
//
// Storage quota enforcement for the four upload routes that write countable
// bytes (photos, videos, backgrounds, cemetery). See utils/storageQuota.js for
// what counts and what does not.
//
// Pipeline order matters:
//
//   preCheck -> <uploader> -> compressUploads -> enforce -> controller
//
//   preCheck  reads the live quota onto req.storageQuota. The uploader needs it
//             to clamp multer's per-file limit, so it MUST run first.
//   enforce   runs last because it charges post-compression sizes.

const fs = require('fs');
const { getConnection } = require('../db/connectionManager');
const { getQuota, toMb } = require('../utils/storageQuota');
 
const QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED';
 
const unlinkQuiet = (p) => {
  try {
    if (p && fs.existsSync(p)) fs.unlinkSync(p);
  } catch (err) {
    console.error('[quota] cleanup failed:', err.message);
  }
};
 
const quotaPayload = (quota, extra = {}) => ({
  status: 'error',
  code: QUOTA_EXCEEDED,
  plan: quota.plan,
  usedMb: quota.usedMb,
  totalMb: quota.totalMb,
  remainingMb: quota.remainingMb,
  ...extra,
});
 
/**
 * Loads the account's quota and rejects when there is no space at all.
 *
 * This is the ONLY rejection possible before touching disk. Partial accept
 * means a request that is merely "too big overall" cannot be pre-rejected —
 * some of its files may still fit, and their sizes are unknowable until multer
 * has parsed the body.
 */
exports.preCheck = async (req, res, next) => {
  try {
    const codeNo = req.user?.codeNo;
    if (!codeNo) {
      return res.status(401).json({ status: 'error', message: 'Missing account scope' });
    }
 
    const db = getConnection(process.env.DB_TYPE);
    const quota = await getQuota(db, codeNo);
    req.storageQuota = quota;
 
    if (quota.remainingBytes <= 0) {
      return res.status(413).json(
        quotaPayload(quota, {
          message: `Your ${quota.plan} plan is full (${quota.usedMb} MB of ${quota.totalMb} MB). Upgrade or remove some files to upload more.`,
        })
      );
    }
 
    return next();
  } catch (err) {
    console.error('[quota] preCheck error:', err);
    return res.status(500).json({ status: 'error', message: 'Could not check storage' });
  }
};
 
/**
 * Charges post-compression sizes against the remaining quota.
 *
 * Accepts in upload order rather than smallest-first: taking files out of order
 * to fit more in would be surprising, and "your 3rd and 7th photos uploaded"
 * is a worse outcome than a predictable prefix.
 *
 * On success sets req.files to the accepted subset and rewrites
 * req.body.descriptions to match, so the controllers need no changes —
 * parseDescriptions(raw, files.length) stays aligned.
 */
exports.enforce = async (req, res, next) => {
  const files = req.files || [];
  const quota = req.storageQuota;
 
  if (!files.length) return next();
  if (!quota) {
    // preCheck must have run; refusing is safer than charging nothing.
    files.forEach((f) => unlinkQuiet(f.path));
    return res.status(500).json({ status: 'error', message: 'Storage check missing' });
  }
 
  const accepted = [];
  const acceptedIndexes = [];
  const skipped = [];
  let running = 0;
 
  files.forEach((file, index) => {
    const size = Number(file.size) || 0;
    if (running + size <= quota.remainingBytes) {
      accepted.push(file);
      acceptedIndexes.push(index);
      running += size;
    } else {
      skipped.push({ name: file.originalname, sizeMb: toMb(size) });
      unlinkQuiet(file.path);
    }
  });
 
  // Nothing fit -> reject the request so the UI can promote an upgrade.
  if (!accepted.length) {
    return res.status(413).json(
      quotaPayload(quota, {
        message: `Not enough storage. You have ${quota.remainingMb} MB free on your ${quota.plan} plan.`,
        skipped,
      })
    );
  }
 
  req.files = accepted;
 
  // Keep captions aligned with the filtered file list.
  if (typeof req.body?.descriptions === 'string') {
    try {
      const parsed = JSON.parse(req.body.descriptions);
      if (Array.isArray(parsed)) {
        req.body.descriptions = JSON.stringify(acceptedIndexes.map((i) => parsed[i] ?? null));
      }
    } catch (_) {
      /* malformed -> leave as-is; parseDescriptions already tolerates it */
    }
  }
 
  req.quotaResult = { skipped, acceptedBytes: running, quota };
 
  // Partial success has to reach the client, but the four upload controllers all
  // end with a bare res.json({ status:'success' }) and know nothing about quota.
  //
  // Rather than edit each of them, wrap res.json once here to merge the skipped
  // list into whatever the controller returns. The tradeoff is deliberate: this
  // keeps the controllers ignorant of quota entirely, at the cost of a response
  // this middleware rewrites on their behalf. If that indirection ever becomes
  // confusing, the explicit alternative is to have each controller read
  // req.quotaResult itself and include it.
  if (skipped.length) {
    const sendJson = res.json.bind(res);
    res.json = (body) => {
      if (body && body.status === 'success') {
        return sendJson({
          ...body,
          code: 'STORAGE_QUOTA_PARTIAL',
          skipped,
          plan: quota.plan,
          usedMb: quota.usedMb,
          totalMb: quota.totalMb,
          message: `${accepted.length} file${accepted.length > 1 ? 's' : ''} uploaded. ${skipped.length} skipped - not enough storage.`,
        });
      }
      return sendJson(body);
    };
  }
 
  return next();
};
 
exports.QUOTA_EXCEEDED = QUOTA_EXCEEDED;