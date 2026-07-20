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
      ORDER BY id ASC
    `;

    const queryWithCond = `
      SELECT ${fieldList}
      FROM mt_deceased
      WHERE show = TRUE
      ORDER BY id ASC
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

exports.getDeceasedById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT *
      FROM mt_deceased
      WHERE id = $1 AND show = TRUE
    `;

    const db = getConnection(process.env.DB_TYPE);
    const rows = await runQuery(db, query, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        message: 'Record not found',
      });
    }

    return res.json(rows[0]);
  } catch (error) {
    console.error('getDeceasedById error:', error);
    return res.status(500).json({
      message: 'Failed to retrieve record',
    });
  }
};

exports.updateDeceased = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code_no, url_name, status, memorial_name, register_date, gender } = req.body || {};

    const fieldsToUpdate = {
      code_no,
      url_name,
      status,
      memorial_name,
      register_date,
      gender,
    };

    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(fieldsToUpdate)) {
      if (value !== undefined) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({
        message: 'No fields provided to update',
      });
    }

    values.push(id);

    const query = `
      UPDATE mt_deceased
      SET ${setClauses.join(', ')}
      WHERE id = ${paramIndex}
    `;

    const db = getConnection(process.env.DB_TYPE);
    await runQuery(db, query, values);

    return res.json({
      success: true,
      message: 'Record updated successfully',
    });
  } catch (error) {
    console.error('updateDeceased error:', error);
    return res.status(500).json({
      message: 'Failed to update record',
    });
  }
};

exports.softDeleteDeceased = async (req, res, next) => {
  try {
    const { id } = req.params; 
    
    const query = `
      UPDATE mt_deceased
      SET show = FALSE
      WHERE id = $1
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