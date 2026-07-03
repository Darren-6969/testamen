// controllers/settingController.js
const { getConnection, runQuery } = require('../db/connectionManager');
const { hashPassword, comparePassword } = require('../utils/hashUtils');

exports.getDeceased = async (req, res, next) => {
  try {
    const { fields } = req.body || {};
    let fieldList;

    if (Array.isArray(fields) && fields.length > 0) {
      fieldList = fields
        .map(f => f.replace(/[^a-zA-Z0-9_\. ]/g, ''))
        .join(', ');
    }

    const defaultQuery = `
      SELECT *
      FROM mt_deceased
      WHERE show = TRUE
      ORDER BY number_list ASC
    `;

    const queryWithCond = `
      SELECT ${fieldList}
      FROM mt_deceased
      WHERE show = TRUE
      ORDER BY number_list ASC
    `;

    const db = getConnection(process.env.DB_TYPE);
    const query = fieldList ? queryWithCond : defaultQuery;
    const rows = await runQuery(db, query);

    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Failed to retrieve results',
    });
  }
};


exports.softDeleteDeceased = async (req, res, next) => {
  try {
    const { id } = req.params; 
    
    const query = `
      UPDATE mt_deceased
      SET show = FALSE
      WHERE number_list = $1
    `;

    const db = getConnection(process.env.DB_TYPE);
    await runQuery(db, query, [id]);

    return res.json({ 
      success: true, 
      message: 'Record soft-deleted successfully' 
    });
  } catch (error) {
    console.error('softDeleteDeceased error:', error);
    return res.status(500).json({
      message: 'Failed to delete record',
    });
  }
};