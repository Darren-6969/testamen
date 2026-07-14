// src/controllers/tributeController.js
// Admin side of tributes: list + soft-delete. (Visitors CREATE tributes on the
// public page -> mt_tribute; that insert path is separate.)

const { getConnection, runQuery } = require('../db/connectionManager');
const { ownsMemorial } = require('../utils/adminHelpers');

exports.listTributes = async (req, res) => {
  try {
    const { memorialId } = req.params;
    const db = getConnection(process.env.DB_TYPE);
    if (!(await ownsMemorial(db, memorialId, req.user?.codeNo))) {
      return res.status(403).json({ message: 'Not your memorial' });
    }
    const rows = await runQuery(
      db,
      `SELECT id,
              mf_creator     AS by,
              mf_description AS description,
              mf_date        AS date
       FROM mt_tribute
       WHERE memorial_id = $1 AND deleted_at IS NULL
       ORDER BY mf_date DESC, id DESC`,
      [String(memorialId)]
    );
    return res.json(rows || []);
  } catch (err) {
    console.error('listTributes error:', err);
    return res.status(500).json({ message: 'Failed to load tributes' });
  }
};

exports.deleteTribute = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getConnection(process.env.DB_TYPE);
    // scope the soft-delete to a memorial the caller owns
    const rows = await runQuery(
      db,
      `UPDATE mt_tribute t
       SET deleted_at = now()
       FROM mt_deceased d
       WHERE t.id = $1
         AND t.memorial_id = d.number_list
         AND d.code_no = $2
         AND t.deleted_at IS NULL
       RETURNING t.id`,
      [id, req.user?.codeNo]
    );
    if (!rows.length) return res.status(404).json({ message: 'Tribute not found' });
    return res.json({ status: 'success' });
  } catch (err) {
    console.error('deleteTribute error:', err);
    return res.status(500).json({ status: 'error', message: 'Failed to delete tribute' });
  }
};