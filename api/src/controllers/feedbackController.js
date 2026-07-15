const { getConnection, runQuery } = require('../db/connectionManager');

// basic escaping since runQuery does not appear to support parameter binding
const esc = (val) =>
  val === undefined || val === null || String(val).trim() === ''
    ? null
    : String(val).trim().replace(/'/g, "''");

/**
 * GET FEEDBACK (only active records)
 */
exports.getFeedback = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);

    const { fields } = req.body || {};
    let fieldList;

    if (Array.isArray(fields) && fields.length > 0) {
      fieldList = fields
        .map(f => f.replace(/[^a-zA-Z0-9_\. ]/g, ''))
        .join(', ');
    }

    const query = fieldList
      ? `SELECT ${fieldList} FROM mt_feedback WHERE is_show = TRUE ORDER BY id DESC`
      : `SELECT * FROM mt_feedback WHERE is_show = TRUE ORDER BY id DESC`;

    const rows = await runQuery(db, query);

    return res.json(rows);
  } catch (error) {
    console.error('GET FEEDBACK ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve feedback',
    });
  }
};

/**
 * GET SINGLE FEEDBACK BY ID (used to preload the edit form)
 */
exports.getFeedbackById = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const { id } = req.params;

    if (!Number.isFinite(Number(id))) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const query = `
      SELECT id, name, email, memorial_name, message, date, "time", type_inquiry, status, is_show
      FROM mt_feedback
      WHERE id = ${Number(id)}
    `;

    const result = await runQuery(db, query);
    const row = Array.isArray(result) ? result[0] : result;

    if (!row) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    return res.json({ success: true, data: row });
  } catch (error) {
    console.error('GET FEEDBACK BY ID ERROR:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * CREATE FEEDBACK
 */
exports.createFeedback = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const { name, email, message, memorial_name, type_inquiry } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const nameVal = esc(name);
    const emailVal = esc(email);
    const messageVal = esc(message);
    const memorialVal = esc(memorial_name);
    const typeVal = esc(type_inquiry) || 'General';

    // mt_feedback.id has no default/sequence in the DB, so we compute the
    // next id manually inside the same statement to avoid a round trip.
    const query = `
      INSERT INTO mt_feedback (id, name, email, memorial_name, message, date, "time", type_inquiry, status, is_show)
      SELECT
        COALESCE(MAX(id), 0) + 1,
        '${nameVal}',
        ${emailVal ? `'${emailVal}'` : 'NULL'},
        ${memorialVal ? `'${memorialVal}'` : 'NULL'},
        '${messageVal}',
        CURRENT_DATE,
        CURRENT_TIME,
        '${typeVal}',
        'New',
        TRUE
      FROM mt_feedback
      RETURNING id, name, email, memorial_name, message, date, "time", type_inquiry, status, is_show
    `;

    const result = await runQuery(db, query);
    const row = Array.isArray(result) ? result[0] : result;

    return res.json({
      success: true,
      message: 'Feedback created successfully',
      data: row,
    });
  } catch (error) {
    console.error('CREATE FEEDBACK ERROR:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * UPDATE FEEDBACK
 * Only columns actually present in the request body are updated, so
 * partial payloads (e.g. { status: 'Resolved' }) work as expected.
 */
exports.updateFeedback = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const { id } = req.params;

    if (!Number.isFinite(Number(id))) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const { name, email, message, memorial_name, type_inquiry, status } = req.body || {};

    // Only touch columns the caller actually sent.
    const updates = [];
    if (name !== undefined) updates.push(`name = ${esc(name) ? `'${esc(name)}'` : 'NULL'}`);
    if (email !== undefined) updates.push(`email = ${esc(email) ? `'${esc(email)}'` : 'NULL'}`);
    if (message !== undefined) updates.push(`message = ${esc(message) ? `'${esc(message)}'` : 'NULL'}`);
    if (memorial_name !== undefined) updates.push(`memorial_name = ${esc(memorial_name) ? `'${esc(memorial_name)}'` : 'NULL'}`);
    if (type_inquiry !== undefined) updates.push(`type_inquiry = ${esc(type_inquiry) ? `'${esc(type_inquiry)}'` : 'NULL'}`);
    if (status !== undefined) updates.push(`status = ${esc(status) ? `'${esc(status)}'` : 'NULL'}`);

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    const query = `
      UPDATE mt_feedback
      SET ${updates.join(', ')}
      WHERE id = ${Number(id)}
      RETURNING id, name, email, memorial_name, message, date, "time", type_inquiry, status, is_show
    `;

    const result = await runQuery(db, query);
    const row = Array.isArray(result) ? result[0] : result;

    if (!row) {
      return res.status(404).json({ success: false, message: 'Feedback not found' });
    }

    return res.json({
      success: true,
      message: 'Feedback updated successfully',
      data: row,
    });
  } catch (error) {
    console.error('UPDATE FEEDBACK ERROR:', error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * SOFT DELETE FEEDBACK
 * Row is kept in the table; is_show is flipped to false so it drops out of
 * the listing (getFeedback filters WHERE is_show = TRUE). Can be restored
 * later by setting is_show back to true.
 */
exports.deleteFeedback = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const { id } = req.params;

    if (!Number.isFinite(Number(id))) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }

    const query = `
      UPDATE mt_feedback
      SET is_show = FALSE
      WHERE id = ${Number(id)}
    `;

    await runQuery(db, query);

    return res.json({
      success: true,
      message: "Soft delete success",
    });
  } catch (error) {
    console.error("DELETE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};