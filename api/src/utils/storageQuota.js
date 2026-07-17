// src/utils/storageQuota.js
// Single source of truth for "how much space does this account have left".
//
// COUNTED (must match every table with a size column that a customer can grow):
//   mt_photo.file_size, mt_video.file_size, mt_memorial_background.file_size,
//   mt_cemetary_image.image_size
// NOT COUNTED (deliberate):
//   mt_profile.profile_pic     - no size column
//   mt_obituary.mf_img         - no size column
//   mt_user_account.picture    - account avatar; never charged to the quota
//
// Soft-deleted rows are excluded (deleted_at IS NULL), so deleting media frees
// quota immediately even though the file stays on disk until it is purged.

const { runQuery } = require('../db/connectionManager');

const toInt = (v) => {
  const n = parseInt(String(v ?? '').trim(), 10);
  return Number.isFinite(n) ? n : 0;
};

const MB = 1024 * 1024;
const toMb = (bytes) => Math.round((bytes / MB) * 10) / 10;

/**
 * Compute live quota for an account. Never cached: an upgrade to a bigger plan
 * must take effect on the very next request, so a blocked user can always buy
 * their way out immediately.
 *
 * @returns {Promise<{plan:string,usedBytes:number,usedMb:number,totalBytes:number,totalMb:number,remainingBytes:number,remainingMb:number}>}
 */
async function getQuota(db, codeNo) {
  // --- plan / allowance ---
  const acc = await runQuery(
    db,
    `SELECT feature_id, referral_bonus_mb FROM mt_user_account WHERE code_no = $1 LIMIT 1`,
    [codeNo]
  );
  const featureId = acc?.[0]?.feature_id;
  const bonusMb = toInt(acc?.[0]?.referral_bonus_mb);

  let feature;
  if (featureId && /^[0-9]+$/.test(String(featureId))) {
    feature = await runQuery(
      db,
      `SELECT feature_plan AS plan, storage_mb FROM mt_feature WHERE id = $1 LIMIT 1`,
      [String(featureId)]
    );
  }
  if (!feature || !feature.length) {
    // null / unknown feature_id => Free tier
    feature = await runQuery(
      db,
      `SELECT feature_plan AS plan, storage_mb FROM mt_feature WHERE feature_plan = 'Free' LIMIT 1`
    );
  }

  const plan = feature?.[0]?.plan || 'Free';
  const totalMb = toInt(feature?.[0]?.storage_mb) + bonusMb;
  const totalBytes = totalMb * MB;

  // --- used (bytes) across this account's memorials ---
  const memScope = `(SELECT number_list FROM mt_deceased WHERE code_no = $1)`;
  const usedRows = await runQuery(
    db,
    `SELECT
       (SELECT COALESCE(SUM(file_size),0) FROM mt_photo
          WHERE deleted_at IS NULL AND memorial_id IN ${memScope}) +
       (SELECT COALESCE(SUM(file_size),0) FROM mt_video
          WHERE deleted_at IS NULL AND memorial_id IN ${memScope}) +
       (SELECT COALESCE(SUM(file_size),0) FROM mt_memorial_background
          WHERE deleted_at IS NULL AND memorial_id IN ${memScope}) +
       (SELECT COALESCE(SUM(CASE WHEN image_size ~ '^[0-9]+$' THEN image_size::bigint ELSE 0 END),0)
          FROM mt_cemetary_image WHERE memorial_id IN ${memScope})
       AS used_bytes`,
    [codeNo]
  );

  const usedBytes = Number(usedRows?.[0]?.used_bytes || 0);
  // Clamped at 0: an account already over its limit (e.g. after a plan change)
  // must never produce a negative remaining, which would read as "space free".
  const remainingBytes = Math.max(0, totalBytes - usedBytes);

  return {
    plan,
    usedBytes,
    usedMb: toMb(usedBytes),
    totalBytes,
    totalMb,
    remainingBytes,
    remainingMb: toMb(remainingBytes),
  };
}

module.exports = { getQuota, toMb, MB };