const { getConnection, runQuery } = require('../db/connectionManager');

/**
 * GET /api/plans-storage
 * Fetch all plans from mt_feature
 */
const getPlansStorage = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);

  try {
    const sql = `
      SELECT
        number_list,
        feature_plan,
        storage_mb,
        price_rm,
        status
      FROM public.mt_feature
      
      ORDER BY
        CASE
          WHEN status::text ~ '^[0-9]+$' THEN status::int
          ELSE 999999
        END ASC,
        id ASC
    `;

    const rows = await runQuery(db, sql);

    const data = rows.map((item) => ({
      number_list: Number(item.number_list),
      feature_plan: item.feature_plan || '',
      status: item.status,
      storage_mb: Number(item.storage_mb || 0),
      price_rm: Number(item.price_rm || 0),
    }));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('getPlansStorage error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch plans and storage settings',
      error: error.message,
    });
  }
};

/**
 * PUT /api/plans-storage
 * Update storage_mb and price_rm for multiple plans
 */
const updatePlansStorage = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);

  try {
    const { plans } = req.body;

    if (!Array.isArray(plans)) {
      return res.status(400).json({
        success: false,
        message: 'Plans must be an array',
      });
    }

    const updatedRows = [];

    for (const plan of plans) {
      const id = Number(plan.id);
      let storageMb = Number(plan.storage_mb);
      let priceRm = Number(plan.price_rm);

      if (!id || Number.isNaN(id)) {
        continue;
      }

      if (Number.isNaN(storageMb) || storageMb < 0) {
        storageMb = 0;
      }

      if (Number.isNaN(priceRm) || priceRm < 0) {
        priceRm = 0;
      }

      storageMb = Math.floor(storageMb);
      priceRm = Number(priceRm.toFixed(2));

      const updateSql = `
        UPDATE public.mt_feature
        SET
          storage_mb = $1,
          price_rm = $2
        WHERE id = $3
        RETURNING
          id,
          feature_plan,
          status,
          storage_mb,
          price_rm
      `;

      const rows = await runQuery(db, updateSql, [
        storageMb,
        priceRm,
        id,
      ]);

      if (rows.length > 0) {
        updatedRows.push(rows[0]);
      }
    }

    const data = updatedRows.map((item) => ({
      id: Number(item.id),
      feature_plan: item.feature_plan || '',
      status: item.status,
      storage_mb: Number(item.storage_mb || 0),
      price_rm: Number(item.price_rm || 0),
    }));

    return res.status(200).json({
      success: true,
      message: 'Plans updated successfully',
      data,
    });
  } catch (error) {
    console.error('updatePlansStorage error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update plans and storage settings',
      error: error.message,
    });
  }
};

module.exports = {
  getPlansStorage,
  updatePlansStorage,
};