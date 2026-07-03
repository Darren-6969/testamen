const { getConnection, runQuery } = require('../db/connectionManager');
const { hashPassword, comparePassword } = require('../utils/hashUtils');
/**
 * GET /api/public
 * Fetch all public prayers
 */
const getPublicPrayers = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);

  try {
    const sql = `
      SELECT
        id,
        message,
        email,
        created_date
      FROM public.mt_public_prayer
      ORDER BY id ASC
    `;

    const rows = await runQuery(db, sql);

    return res.status(200).json({
      success: true,
      message: 'Public prayers fetched successfully.',
      data: rows,
    });
  } catch (error) {
    console.error('getPublicPrayers error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch public prayers.',
      error: error.message,
    });
  }
};

/**
 * GET /api/public/:id
 * Fetch single public prayer by ID
 */
const getPublicPrayerById = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  const { id } = req.params;

  try {
    const sql = `
      SELECT
        id,
        message,
        email,
        created_date
      FROM public.mt_public_prayer
      WHERE id = $1
      LIMIT 1
    `;

    const rows = await runQuery(db, sql, [id]);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Public prayer not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Public prayer fetched successfully.',
      data: rows[0],
    });
  } catch (error) {
    console.error('getPublicPrayerById error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch public prayer.',
      error: error.message,
    });
  }
};

/**
 * POST /api/public
 * Create public prayer
 */
const createPublicPrayer = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);

  const {
    message,
    email,
  } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Message is required.',
    });
  }

  try {
    const sql = `
      INSERT INTO public.mt_public_prayer (
        message,
        email,
        created_date
      )
      VALUES ($1, $2, CURRENT_DATE)
      RETURNING
        id,
        message,
        email,
        created_date
    `;

    const rows = await runQuery(db, sql, [
      message.trim(),
      email || null,
    ]);

    return res.status(201).json({
      success: true,
      message: 'Public prayer created successfully.',
      data: rows[0],
    });
  } catch (error) {
    console.error('createPublicPrayer error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create public prayer.',
      error: error.message,
    });
  }
};

/**
 * PUT /api/public/:id
 * Update public prayer
 */
const updatePublicPrayer = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  const { id } = req.params;

  const {
    message,
    email,
  } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Message is required.',
    });
  }

  try {
    const sql = `
      UPDATE public.mt_public_prayer
      SET
        message = $1,
        email = $2
      WHERE id = $3
      RETURNING
        id,
        message,
        email,
        created_date
    `;

    const rows = await runQuery(db, sql, [
      message.trim(),
      email || null,
      id,
    ]);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Public prayer not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Public prayer updated successfully.',
      data: rows[0],
    });
  } catch (error) {
    console.error('updatePublicPrayer error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update public prayer.',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/public/:id
 * Delete public prayer
 */
const deletePublicPrayer = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  const { id } = req.params;

  try {
    const sql = `
      DELETE FROM public.mt_public_prayer
      WHERE id = $1
      RETURNING id
    `;

    const rows = await runQuery(db, sql, [id]);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Public prayer not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Public prayer deleted successfully.',
      data: rows[0],
    });
  } catch (error) {
    console.error('deletePublicPrayer error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete public prayer.',
      error: error.message,
    });
  }
};

module.exports = {
  getPublicPrayers,
  getPublicPrayerById,
  createPublicPrayer,
  updatePublicPrayer,
  deletePublicPrayer,
};