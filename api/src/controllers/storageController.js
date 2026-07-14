// src/controllers/storageController.js
// Account-level storage usage: quota from the plan (mt_feature), used = summed
// file_size across all media of the account's memorials. Feeds the dashboard
// storage card and the admin shell bar.

const { getConnection, runQuery } = require('../db/connectionManager');

const toInt = (v) => {
  const n = parseInt(String(v ?? '').trim(), 10);
  return Number.isFinite(n) ? n : 0;
};

exports.getStorage = async (req, res) => {
  try {
    const codeNo = req.user?.codeNo;
    if (!codeNo) return res.status(401).json({ message: 'Missing account scope' });
    const db = getConnection(process.env.DB_TYPE);

    // --- plan / quota ---
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
    const usedMb = Math.round((usedBytes / (1024 * 1024)) * 10) / 10;

    return res.json({ usedMb, totalMb, plan });
  } catch (err) {
    console.error('getStorage error:', err);
    return res.status(500).json({ message: 'Failed to load storage' });
  }
};