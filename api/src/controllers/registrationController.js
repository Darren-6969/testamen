const { getConnection, runQuery } = require('../db/connectionManager');
const { hashPassword, comparePassword } = require('../utils/hashUtils');

/**
 * Get single registration by ID
 */
exports.getRegistration = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ message: 'Invalid ID' });
    }

    const query = `
      SELECT *
      FROM mt_user_account
      WHERE id = ${id}
      AND "show" = true
    `;

    const rows = await runQuery(db, query);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error('GET REGISTRATION ERROR:', error);
    return res.status(500).json({ message: 'Failed to retrieve registration' });
  }
};

/**
 * Get all registrations (list)
 */
exports.getAllRegistrations = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    const query = `
      SELECT *
      FROM mt_user_account
      WHERE "show" = true
      ORDER BY id ASC
    `;

    const rows = await runQuery(db, query);
    return res.json(rows || []);
  } catch (error) {
    console.error('GET ALL REGISTRATIONS ERROR:', error);
    return res.status(500).json({ message: 'Failed to retrieve registrations' });
  }
};

/**
 * Soft delete registration
 */
exports.deleteRegistration = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const id = Number(req.params.id);
    console.log('DELETE ID:', id);

    const query = `
      UPDATE mt_user_account
      SET "show" = false
      WHERE id = ${id}
    `;

    await runQuery(db, query);
    return res.json({ success: true, message: 'Soft delete successful' });
  } catch (error) {
    console.error('DELETE ERROR:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};