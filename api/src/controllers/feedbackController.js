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

    console.log("DELETE REQUEST ID:", id);

    const query = `
      UPDATE mt_feedback
      SET is_show = false
      WHERE number_list = ${Number(id)}
    `;

    const result = await runQuery(db, query);

    console.log("DELETE RESULT:", result);

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