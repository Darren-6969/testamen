const { getConnection, runQuery } = require('../db/connectionManager');
const { hashPassword, comparePassword } = require('../utils/hashUtils');

// Fetch all public prayers
const getPublicPrayers = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);

  const { message, email, created_date } = req.query;

  try {
    const conditions = [];
    const params = [];

    if (message) {
      params.push(`%${message}%`);
      conditions.push(`message ILIKE $${params.length}`);
    }

    if (email) {
      params.push(`%${email}%`);
      conditions.push(`email ILIKE $${params.length}`);
    }

    if (created_date) {
      params.push(`%${created_date}%`);
      conditions.push(`TO_CHAR(created_date, 'YYYY-MM-DD') ILIKE $${params.length}`);
    }

    conditions.push('is_visible = true');

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT
        id,
        message,
        email,
        created_date,
        status,
        is_visible
      FROM public.mt_public_prayer
      ${whereClause}
      ORDER BY id ASC
    `;

    const rows = await runQuery(db, sql, params);

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

// Fetch single public prayer by ID
const getPublicPrayerById = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  const { id } = req.params;

  try {
    const sql = `
      SELECT
        id,
        message,
        email,
        created_date,
        status,
        is_visible
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

// Create public prayer
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
        created_date,
        status
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

// Update public prayer
const updatePublicPrayer = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  const { id } = req.params;

  const {
    message,
    email,
    status,
  } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Message is required.',
    });
  }

  if (status !== undefined && typeof status !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'status must be true or false.',
    });
  }

  try {
    const sql = `
      UPDATE public.mt_public_prayer
      SET
        message = $1,
        email = $2,
        status = COALESCE($3, status)
      WHERE id = $4
      RETURNING
        id,
        message,
        email,
        created_date,
        status
    `;

    const rows = await runQuery(db, sql, [
      message.trim(),
      email || null,
      status === undefined ? null : status,
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

//  Soft-delete public prayer
const deletePublicPrayer = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  const { id } = req.params;

  try {
    const sql = `
      UPDATE public.mt_public_prayer
      SET is_visible = false
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