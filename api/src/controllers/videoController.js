// src/controllers/videoController.js
// Videos & Audios tab: mt_video 

const { getConnection, runQuery } = require('../db/connectionManager');
const { ownsMemorial, cleanupFiles, parseDescriptions } = require('../utils/adminHelpers');
const { mediaUrl } = require('../utils/memorialUpload');
const { generatePoster } = require('../utils/videoPoster');

const uploader = (req) => String(req.user?.userId || req.user?.codeNo || '').slice(0, 100);

exports.listVideos = async (req, res) => {
  try {
    const { memorialId } = req.params;
    const db = getConnection(process.env.DB_TYPE);
    if (!(await ownsMemorial(db, memorialId, req.user?.codeNo)))
      return res.status(403).json({ message: 'Not your memorial' });
    const rows = await runQuery(
      db,
      `SELECT id, filename, poster, media_type, description, file_size
       FROM mt_video
       WHERE memorial_id = $1 AND deleted_at IS NULL AND approval_status = 'approved'
       ORDER BY id DESC`,
      [String(memorialId)]
    );
    return res.json(
      (rows || []).map((r) => ({
        id: String(r.id),
        url: mediaUrl('videos', r.filename),
        poster: r.poster ? mediaUrl('videos', r.poster) : null,
        mediaType: r.media_type === 'audio' ? 'audio' : 'video',
        description: r.description || '',
        sizeBytes: Number(r.file_size) || 0,
      }))
    );
  } catch (err) {
    console.error('listVideos error:', err);
    return res.status(500).json({ message: 'Failed to load videos' });
  }
};

exports.uploadVideos = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  try {
    const memorialId = req.body.memorialId;
    const files = req.files || [];
    const descriptions = parseDescriptions(req.body.descriptions, files.length);
    if (!(await ownsMemorial(db, memorialId, req.user?.codeNo))) {
      cleanupFiles(files);
      return res.status(403).json({ status: 'error', message: 'Not your memorial' });
    }
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const mediaType = f.mimetype.startsWith('audio/') ? 'audio' : 'video';
      // Audio has no frames to grab. Video posters fail soft: a null poster just
      // means the UI shows the glyph fallback, so we never fail the upload here.
      const poster = mediaType === 'video' ? await generatePoster(f.path) : null;
      await runQuery(
        db,
        `INSERT INTO mt_video
           (memorial_id, filename, poster, media_type, file_size, description, uploaded_by, approval_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved')`,
        [String(memorialId), f.filename, poster, mediaType, f.size, descriptions[i], uploader(req)]
      );
    }
    return res.json({ status: 'success' });
  } catch (err) {
    console.error('uploadVideos error:', err);
    cleanupFiles(req.files);
    return res.status(500).json({ status: 'error', message: 'Upload failed' });
  }
};

exports.deleteVideo = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  try {
    const { id } = req.params;
    const rows = await runQuery(
      db,
      `UPDATE mt_video v SET deleted_at = now()
       FROM mt_deceased d
       WHERE v.id = $1 AND v.memorial_id = d.number_list AND d.code_no = $2 AND v.deleted_at IS NULL
       RETURNING v.id`,
      [id, req.user?.codeNo]
    );
    if (!rows.length) return res.status(404).json({ status: 'error', message: 'Not found' });
    return res.json({ status: 'success' });
  } catch (err) {
    console.error('deleteVideo error:', err);
    return res.status(500).json({ status: 'error', message: 'Delete failed' });
  }
};