// src/controllers/approvalController.js
// Customer admin module approval tab: family/friend uploads with approval_status = 'pending' across
// mt_photo and mt_video. Owner approves/rejects.

const { getConnection, runQuery } = require('../db/connectionManager');
const { ownsMemorial } = require('../utils/adminHelpers');
const { mediaUrl } = require('../utils/memorialUpload');

exports.listPending = async (req, res) => {
  try {
    const { memorialId } = req.params;
    const db = getConnection(process.env.DB_TYPE);
    if (!(await ownsMemorial(db, memorialId, req.user?.codeNo)))
      return res.status(403).json({ message: 'Not your memorial' });

    const photos = await runQuery(
      db,
      `SELECT id, filename, file_size, uploaded_by, created_at FROM mt_photo
       WHERE memorial_id = $1 AND deleted_at IS NULL AND approval_status = 'pending'
       ORDER BY id DESC`,
      [String(memorialId)]
    );
    const videos = await runQuery(
      db,
      `SELECT id, filename, poster, media_type, file_size, uploaded_by, created_at FROM mt_video
       WHERE memorial_id = $1 AND deleted_at IS NULL AND approval_status = 'pending'
       ORDER BY id DESC`,
      [String(memorialId)]
    );

    const out = [
      ...photos.map((r) => ({
        id: `photo:${r.id}`,
        kind: 'photo',
        url: mediaUrl('photos', r.filename),
        sizeBytes: Number(r.file_size) || 0,
        uploadedBy: r.uploaded_by,
        uploadedAt: r.created_at,
      })),
      ...videos.map((r) => ({
        id: `video:${r.id}`,
        kind: 'video',
        url: mediaUrl('videos', r.filename),
        poster: r.poster ? mediaUrl('videos', r.poster) : null,
        mediaType: r.media_type === 'audio' ? 'audio' : 'video',
        sizeBytes: Number(r.file_size) || 0,
        uploadedBy: r.uploaded_by,
        uploadedAt: r.created_at,
      })),
    ];
    return res.json(out);
  } catch (err) {
    console.error('listPending error:', err);
    return res.status(500).json({ message: 'Failed to load pending items' });
  }
};

// PATCH /api/admin/approval/:compositeId  body { decision: 'approved'|'rejected' }
// compositeId is "photo:<id>" or "video:<id>"
exports.decide = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  try {
    const [kind, rawId] = String(req.params.compositeId || '').split(':');
    const decision = req.body.decision === 'rejected' ? 'rejected' : 'approved';
    const table = kind === 'video' ? 'mt_video' : kind === 'photo' ? 'mt_photo' : null;
    if (!table || !rawId)
      return res.status(400).json({ status: 'error', message: 'Bad item id' });

    // Reject also soft-deletes: approval_status records WHY it's gone, deleted_at
    // records that it's no longer live. Both are needed because storageController
    // sums file_size WHERE deleted_at IS NULL (it does not filter approval_status),
    // so a rejected-but-not-deleted upload would eat the owner's quota forever.
    // The row + file survive on disk, so a reject is still recoverable.

    const rows = await runQuery(
      db,
      `UPDATE ${table} m
          SET approval_status = $1,
              deleted_at = CASE WHEN $2::boolean THEN now() ELSE m.deleted_at END
       FROM mt_deceased d
       WHERE m.id = $3 AND m.memorial_id = d.number_list AND d.code_no = $4
         AND m.deleted_at IS NULL
       RETURNING m.id`,
      [decision, decision === 'rejected', rawId, req.user?.codeNo]
    );
    if (!rows.length) return res.status(404).json({ status: 'error', message: 'Not found' });
    return res.json({ status: 'success' });
  } catch (err) {
    console.error('decide error:', err);
    return res.status(500).json({ status: 'error', message: 'Action failed' });
  }
};