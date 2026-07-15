const { getConnection, runQuery } = require('../db/connectionManager');
// GET /api/plans-storage
const getPlansStorage = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);

  try {
    const sql = `
      SELECT
        id,
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

    const data = rows.map((item, index) => ({
      id: Number(item.id),
      number_list: index + 1,
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

// Fetch a single plan by id (used by the Edit page)
const getPlansStorageById = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);

  try {
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan id',
      });
    }

    const sql = `
      SELECT
        id,
        feature_plan,
        storage_mb,
        price_rm,
        status
      FROM public.mt_feature
      WHERE id = $1
    `;

    const rows = await runQuery(db, sql, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Storage plan not found',
      });
    }

    const item = rows[0];

    return res.status(200).json({
      success: true,
      data: {
        id: Number(item.id),
        feature_plan: item.feature_plan || '',
        status: item.status,
        storage_mb: Number(item.storage_mb || 0),
        price_rm: Number(item.price_rm || 0),
      },
    });
  } catch (error) {
    console.error('getPlansStorageById error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch storage plan',
      error: error.message,
    });
  }
};

// Create a new plan
const createPlansStorage = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);

  try {
    const { feature_plan, storage_mb, price_rm, status } = req.body;

    if (!feature_plan || !String(feature_plan).trim()) {
      return res.status(400).json({
        success: false,
        message: 'feature_plan is required',
      });
    }

    let storageMb = Number(storage_mb);
    let priceRm = Number(price_rm);

    if (Number.isNaN(storageMb) || storageMb < 0) storageMb = 0;
    if (Number.isNaN(priceRm) || priceRm < 0) priceRm = 0;

    storageMb = Math.floor(storageMb);
    priceRm = Number(priceRm.toFixed(2));

    const sql = `
      INSERT INTO public.mt_feature (feature_plan, storage_mb, price_rm, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id, feature_plan, storage_mb, price_rm, status
    `;

    const rows = await runQuery(db, sql, [
      String(feature_plan).trim(),
      storageMb,
      priceRm,
      status || 'active',
    ]);

    const item = rows[0];

    return res.status(201).json({
      success: true,
      message: 'Storage plan created successfully',
      data: {
        id: Number(item.id),
        feature_plan: item.feature_plan || '',
        status: item.status,
        storage_mb: Number(item.storage_mb || 0),
        price_rm: Number(item.price_rm || 0),
      },
    });
  } catch (error) {
    console.error('createPlansStorage error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create storage plan',
      error: error.message,
    });
  }
};

// Update a single plan (used by the Edit page)
const updatePlansStorageById = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);

  try {
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan id',
      });
    }

    const { feature_plan, storage_mb, price_rm, status } = req.body;

    let storageMb = Number(storage_mb);
    let priceRm = Number(price_rm);

    if (Number.isNaN(storageMb) || storageMb < 0) storageMb = 0;
    if (Number.isNaN(priceRm) || priceRm < 0) priceRm = 0;

    storageMb = Math.floor(storageMb);
    priceRm = Number(priceRm.toFixed(2));

    const sql = `
      UPDATE public.mt_feature
      SET
        feature_plan = COALESCE($1, feature_plan),
        storage_mb = $2,
        price_rm = $3,
        status = COALESCE($4, status)
      WHERE id = $5
      RETURNING id, feature_plan, storage_mb, price_rm, status
    `;

    const rows = await runQuery(db, sql, [
      feature_plan ? String(feature_plan).trim() : null,
      storageMb,
      priceRm,
      status || null,
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Storage plan not found',
      });
    }

    const item = rows[0];

    return res.status(200).json({
      success: true,
      message: 'Storage plan updated successfully',
      data: {
        id: Number(item.id),
        feature_plan: item.feature_plan || '',
        status: item.status,
        storage_mb: Number(item.storage_mb || 0),
        price_rm: Number(item.price_rm || 0),
      },
    });
  } catch (error) {
    console.error('updatePlansStorageById error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update storage plan',
      error: error.message,
    });
  }
};

// Bulk-update storage_mb and price_rm for multiple plans
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

// Delete a single plan
const deletePlansStorage = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);

  try {
    const id = Number(req.params.id);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan id',
      });
    }

    const sql = `
      DELETE FROM public.mt_feature
      WHERE id = $1
      RETURNING id
    `;

    const rows = await runQuery(db, sql, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Storage plan not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Storage plan deleted successfully',
    });
  } catch (error) {
    console.error('deletePlansStorage error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete storage plan',
      error: error.message,
    });
  }
};

module.exports = {
  getPlansStorage,
  getPlansStorageById,
  createPlansStorage,
  updatePlansStorage,
  updatePlansStorageById,
  deletePlansStorage,
};