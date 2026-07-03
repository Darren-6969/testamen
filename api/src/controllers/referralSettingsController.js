const { getConnection, runQuery } = require('../db/connectionManager');

/**
 * Ensure at least one referral settings row exists.
 * Default:
 * mb_per_referral = 10
 * max_referrals = 4
 */
const ensureReferralSettingsRow = async (db) => {
  const checkSql = `
    SELECT id
    FROM public.mt_referral_settings
    ORDER BY id ASC
    LIMIT 1
  `;

  const existingRows = await runQuery(db, checkSql);

  if (existingRows.length > 0) {
    return existingRows[0].id;
  }

  const insertSql = `
    INSERT INTO public.mt_referral_settings (
      mb_per_referral,
      max_referrals
    )
    VALUES ($1, $2)
    RETURNING id
  `;

  const insertedRows = await runQuery(db, insertSql, [10, 4]);

  return insertedRows[0].id;
};

/**
 * GET /api/referral-settings
 */
const getReferralSettings = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);

  try {
    await ensureReferralSettingsRow(db);

    const sql = `
      SELECT
        id,
        mb_per_referral,
        max_referrals
      FROM public.mt_referral_settings
      ORDER BY id ASC
      LIMIT 1
    `;

    const rows = await runQuery(db, sql);

    const config = rows[0] || {
      id: null,
      mb_per_referral: 10,
      max_referrals: 4,
    };

    return res.status(200).json({
      success: true,
      data: {
        id: config.id,
        mb_per_referral: Number(config.mb_per_referral || 0),
        max_referrals: Number(config.max_referrals || 0),
      },
    });
  } catch (error) {
    console.error('getReferralSettings error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch referral settings',
      error: error.message,
    });
  }
};

/**
 * PUT /api/referral-settings
 */
const updateReferralSettings = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);

  try {
    let { mb_per_referral, max_referrals } = req.body;

    mb_per_referral = Number(mb_per_referral);
    max_referrals = Number(max_referrals);

    if (Number.isNaN(mb_per_referral)) {
      mb_per_referral = 0;
    }

    if (Number.isNaN(max_referrals)) {
      max_referrals = 0;
    }

    if (mb_per_referral < 0) {
      mb_per_referral = 0;
    }

    if (max_referrals < 0) {
      max_referrals = 0;
    }

    mb_per_referral = Math.floor(mb_per_referral);
    max_referrals = Math.floor(max_referrals);

    const settingId = await ensureReferralSettingsRow(db);

    const updateSql = `
      UPDATE public.mt_referral_settings
      SET
        mb_per_referral = $1,
        max_referrals = $2
      WHERE id = $3
      RETURNING
        id,
        mb_per_referral,
        max_referrals
    `;

    const rows = await runQuery(db, updateSql, [
      mb_per_referral,
      max_referrals,
      settingId,
    ]);

    return res.status(200).json({
      success: true,
      message: 'Referral settings updated successfully',
      data: {
        id: rows[0].id,
        mb_per_referral: Number(rows[0].mb_per_referral || 0),
        max_referrals: Number(rows[0].max_referrals || 0),
      },
    });
  } catch (error) {
    console.error('updateReferralSettings error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update referral settings',
      error: error.message,
    });
  }
};

module.exports = {
  getReferralSettings,
  updateReferralSettings,
};