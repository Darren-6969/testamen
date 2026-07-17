// src/controllers/customerDashboardController.js
// Customer dashboard overview: memorials owned by the logged-in account (code_no),
// per-memorial tribute/photo/video stats, and a recent activity feed.
//
// Counting rules:
//   - approval_status = 'approved' only. 'pending' is a family/friend submission from
//     the public site and is NOT part of the memorial until the owner approves it
//     (see approvalController). Owner uploads are written as 'approved' directly.
//   - 'rejected' needs no filter: approvalController.decide() sets deleted_at on reject,
//     so `deleted_at IS NULL` already excludes it.
//
// Activity actor:
//   - mt_tribute.mf_creator is a visitor-typed name from the public site — used as-is.
//   - mt_photo/mt_video.uploaded_by holds an ID, not a name: uploader() writes
//     `req.user.userId || req.user.codeNo`, and for the customer portal userId IS
//     mt_user_account.id (authController sets it; customerController's my-profile
//     endpoint already does the same lookup). So it resolves via mt_user_account,
//     which the app treats as the display name (`username AS name`).
//   - The owner's own uploads render as "You" rather than their own username.

const { getConnection, runQuery } = require('../db/connectionManager');

// mt_tribute stores mf_date (date) + mf_time (time) instead of a timestamp.
const TRIBUTE_TS = `(t.mf_date + COALESCE(t.mf_time, '00:00'::time))`;

const nounFor = (type, count) => {
  const plural = count > 1;
  if (type === 'tribute') return plural ? 'tributes' : 'tribute';
  if (type === 'photo') return plural ? 'photos' : 'photo';
  if (type === 'audio') return plural ? 'audio files' : 'audio file';
  return plural ? 'videos' : 'video';
};

// "Aunt May added a tribute to TEST" / "You added 3 photos to TEST"
const buildMessage = (actor, type, count, memorialName) => {
  const who = actor && String(actor).trim() ? String(actor).trim() : 'You';
  const what = count > 1 ? `${count} ${nounFor(type, count)}` : `a ${nounFor(type, 1)}`;
  return `${who} added ${what} to ${memorialName}`;
};

exports.getOverview = async (req, res) => {
  try {
    const codeNo = req.user.codeNo;
    if (!codeNo) {
      return res.status(401).json({ message: 'Unauthorized: no account code on token' });
    }

    const db = getConnection(process.env.DB_TYPE);

    // --- memorials + per-memorial stats -------------------------------------
    // LEFT JOIN LATERAL (not a plain LEFT JOIN) so a memorial with more than one
    // mt_obituary row yields exactly one card instead of fanning out and inflating
    // totalMemorials.
    const query = `
      SELECT
        d.number_list,
        d.memorial_name,
        d.url_name,
        d.status,
        o.mf_img,
        o.mf_pass_date,
        o.mf_pass_location,
        (SELECT COUNT(*)::int FROM mt_tribute t
           WHERE t.memorial_id = d.number_list AND t.deleted_at IS NULL) AS tribute_count,
        (SELECT MAX(${TRIBUTE_TS}) FROM mt_tribute t
           WHERE t.memorial_id = d.number_list AND t.deleted_at IS NULL) AS tribute_latest,
        (SELECT COUNT(*)::int FROM mt_photo p
           WHERE p.memorial_id = d.number_list AND p.deleted_at IS NULL
             AND p.approval_status = 'approved') AS photo_count,
        (SELECT MAX(p.created_at) FROM mt_photo p
           WHERE p.memorial_id = d.number_list AND p.deleted_at IS NULL
             AND p.approval_status = 'approved') AS photo_latest,
        (SELECT COUNT(*)::int FROM mt_video v
           WHERE v.memorial_id = d.number_list AND v.deleted_at IS NULL
             AND v.approval_status = 'approved') AS video_count,
        (SELECT MAX(v.created_at) FROM mt_video v
           WHERE v.memorial_id = d.number_list AND v.deleted_at IS NULL
             AND v.approval_status = 'approved') AS video_latest
      FROM mt_deceased d
      LEFT JOIN LATERAL (
        SELECT ob.mf_img, ob.mf_pass_date, ob.mf_pass_location
          FROM mt_obituary ob
         WHERE ob.memorial_id = d.number_list
         ORDER BY ob.id DESC
         LIMIT 1
      ) o ON TRUE
      WHERE d.show = TRUE
        AND d.code_no = $1
      ORDER BY d.number_list ASC
    `;

    const rows = await runQuery(db, query, [codeNo]);

    const memorials = rows.map((row) => ({
      numberList: row.number_list,
      name: row.memorial_name,
      urlName: row.url_name,
      status: row.status,
      photoUrl: row.mf_img ? `/api/uploads/obituary/images/${row.mf_img}` : null,
      dateOfDeparture: row.mf_pass_date,
      placeOfRest: row.mf_pass_location,
      tributes: { count: Number(row.tribute_count || 0), latest: row.tribute_latest },
      photos: { count: Number(row.photo_count || 0), latest: row.photo_latest },
      videos: { count: Number(row.video_count || 0), latest: row.video_latest },
    }));

    const aggregate = {
      totalMemorials: memorials.length,
      totalTributes: memorials.reduce((sum, m) => sum + m.tributes.count, 0),
      totalPhotos: memorials.reduce((sum, m) => sum + m.photos.count, 0),
      totalVideos: memorials.reduce((sum, m) => sum + m.videos.count, 0),
    };

    // --- activity feed -------------------------------------------------------
    // Real events, not MAX(date) per memorial. Grouped by (memorial, type, actor, day)
    // so a 20-photo upload is one line instead of flooding the feed.
    //
    // uploaded_by is resolved to a username through mt_user_account (see header note).
    // meId mirrors uploader() exactly so the owner's own rows collapse to "You".
    const meId = String(req.user?.userId || req.user?.codeNo || '');

    let activity = [];
    if (memorials.length > 0) {
      const activityQuery = `
        WITH scope AS (
          SELECT d.number_list, d.memorial_name
            FROM mt_deceased d
           WHERE d.show = TRUE AND d.code_no = $1
        ),
        events AS (
          SELECT 'photo'::text AS type, p.memorial_id, p.created_at AS ts,
                 NULLIF(p.uploaded_by, '')::text AS uploader_id,
                 NULL::text AS creator_name
            FROM mt_photo p
           WHERE p.memorial_id IN (SELECT number_list FROM scope)
             AND p.deleted_at IS NULL AND p.approval_status = 'approved'
             AND p.created_at IS NOT NULL
          UNION ALL
          SELECT CASE WHEN v.media_type = 'audio' THEN 'audio' ELSE 'video' END,
                 v.memorial_id, v.created_at,
                 NULLIF(v.uploaded_by, '')::text,
                 NULL::text
            FROM mt_video v
           WHERE v.memorial_id IN (SELECT number_list FROM scope)
             AND v.deleted_at IS NULL AND v.approval_status = 'approved'
             AND v.created_at IS NOT NULL
          UNION ALL
          SELECT 'tribute', t.memorial_id, ${TRIBUTE_TS},
                 NULL::text,
                 NULLIF(t.mf_creator, '')::text
            FROM mt_tribute t
           WHERE t.memorial_id IN (SELECT number_list FROM scope)
             AND t.deleted_at IS NULL
             AND t.mf_date IS NOT NULL
        ),
        resolved AS (
          SELECT e.type,
                 e.memorial_id,
                 e.ts,
                 CASE
                   -- tribute: visitor-typed name straight from the public site
                   WHEN e.creator_name IS NOT NULL THEN e.creator_name
                   -- the logged-in owner's own upload => NULL => rendered as "You"
                   WHEN e.uploader_id IS NULL OR e.uploader_id = $2 THEN NULL
                   -- another account: resolve the id to a display name
                   ELSE COALESCE(NULLIF(ua.username, ''), 'Someone')
                 END AS actor
            FROM events e
            LEFT JOIN mt_user_account ua ON ua.id::text = e.uploader_id
        )
        SELECT r.type,
               r.memorial_id,
               s.memorial_name,
               r.actor,
               COUNT(*)::int AS item_count,
               MAX(r.ts)     AS ts
          FROM resolved r
          JOIN scope s ON s.number_list = r.memorial_id
         GROUP BY r.type, r.memorial_id, s.memorial_name, r.actor, r.ts::date
         ORDER BY MAX(r.ts) DESC
         LIMIT 5
      `;

      const actRows = await runQuery(db, activityQuery, [codeNo, meId]);

      activity = actRows.map((r) => {
        const count = Number(r.item_count || 0);
        return {
          id: `${r.type}:${r.memorial_id}:${new Date(r.ts).toISOString().slice(0, 10)}:${r.actor || ''}`,
          type: r.type,
          actor: r.actor || null, // null => "You" (owner upload)
          memorialName: r.memorial_name,
          count,
          date: r.ts,
          message: buildMessage(r.actor, r.type, count, r.memorial_name),
        };
      });
    }

    return res.json({ memorials, aggregate, activity });
  } catch (error) {
    console.error('getOverview error:', error);
    return res.status(500).json({ message: 'Failed to retrieve dashboard overview' });
  }
};