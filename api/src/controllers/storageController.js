// src/controllers/storageController.js
// Account-level storage usage: quota from the plan (mt_feature), used = summed
// file_size across all media of the account's memorials. Feeds the dashboard
// storage card and the admin shell bar.
//
// The calculation itself lives in utils/storageQuota.js because quotaMiddleware
// enforces the same number this endpoint displays.
//
// Distinct from plansStorageController.js, which is the staff-facing plan
// configuration screen.

const { getConnection } = require('../db/connectionManager');
const { getQuota } = require('../utils/storageQuota');

exports.getStorage = async (req, res) => {
  try {
    const codeNo = req.user?.codeNo;
    if (!codeNo) return res.status(401).json({ message: 'Missing account scope' });

    const db = getConnection(process.env.DB_TYPE);
    const quota = await getQuota(db, codeNo);

    // usedMb/totalMb/plan is the existing contract the dashboard + shell bar
    // already consume. remainingMb is additive, so nothing breaks.
    return res.json({
      usedMb: quota.usedMb,
      totalMb: quota.totalMb,
      plan: quota.plan,
      remainingMb: quota.remainingMb,
    });
  } catch (err) {
    console.error('getStorage error:', err);
    return res.status(500).json({ message: 'Failed to load storage' });
  }
};