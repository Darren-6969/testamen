const { getConnection, runQuery } = require('../db/connectionManager');

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
      ? `SELECT ${fieldList} FROM mt_feedback WHERE is_show = TRUE ORDER BY number_list DESC`
      : `SELECT * FROM mt_feedback WHERE is_show = TRUE ORDER BY number_list DESC`;

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
 * SOFT DELETE FEEDBACK
 */
exports.deleteFeedback = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const { id } = req.params;

    const query = `
      UPDATE mt_feedback
      SET is_show = false
      WHERE number_list = $1
    `;

    await runQuery(db, query, [String(id)]);

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

/**
 * CREATE FEEDBACK
 */
exports.createFeedback = async (req, res) => {
  try {
    const db = getConnection(process.env.DB_TYPE);
    const { name, email, message } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const insertQuery = `
      INSERT INTO mt_feedback (name, email, message, date, "time", show, is_show)
      VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_TIME, TRUE, TRUE)
      RETURNING id
    `;

    const rows = await runQuery(db, insertQuery, [
      String(name).trim(),
      email ? String(email).trim() : null,
      String(message).trim(),
    ]);

    const newId = rows[0].id;

    // number_list mirrors id as text in the existing data, so keep new rows consistent
    await runQuery(
      db,
      `UPDATE mt_feedback SET number_list = $1 WHERE id = $2`,
      [String(newId), newId]
    );

    return res.status(201).json({
      success: true,
      message: 'Feedback created successfully',
      data: {
        id: newId,
        number_list: String(newId),
        name: String(name).trim(),
        email: email ? String(email).trim() : null,
        message: String(message).trim(),
      },
    });
  } catch (error) {
    console.error('CREATE FEEDBACK ERROR:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create feedback',
    });
  }
};