const { getConnection, runQuery } = require('../db/connectionManager');

exports.getOverview = async (req, res) => {
  try {
    const codeNo = req.user.codeNo;
    if (!codeNo) {
      return res.status(401).json({ message: 'Unauthorized: no account code on token' });
    }

    const db = getConnection(process.env.DB_TYPE);

    const query = `
      SELECT
        d.number_list,
        d.memorial_name,
        d.url_name,
        d.status,
        o.mf_img,
        o.mf_pass_date,
        o.mf_pass_location,
        (SELECT COUNT(*) FROM mt_testimonial t WHERE t.memorial_id = d.number_list) AS tribute_count,
        (SELECT MAX(t.mf_date) FROM mt_testimonial t WHERE t.memorial_id = d.number_list) AS tribute_latest,
        (SELECT COUNT(*) FROM mt_album a WHERE a.memorial_id = d.number_list) AS photo_count,
        (SELECT MAX(a.mf_create_date) FROM mt_album a WHERE a.memorial_id = d.number_list) AS photo_latest
      FROM mt_deceased d
      LEFT JOIN mt_obituary o ON o.memorial_id = d.number_list
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
      videos: { count: 0, latest: null },
    }));

    const aggregate = {
      totalMemorials: memorials.length,
      totalTributes: memorials.reduce((sum, m) => sum + m.tributes.count, 0),
      totalPhotos: memorials.reduce((sum, m) => sum + m.photos.count, 0),
    };

    const activity = [];
    memorials.forEach((m) => {
      if (m.tributes.latest) {
        activity.push({ type: 'tribute', memorialName: m.name, date: m.tributes.latest, message: `New tribute added to ${m.name}` });
      }
      if (m.photos.latest) {
        activity.push({ type: 'photo', memorialName: m.name, date: m.photos.latest, message: `New photo added to ${m.name}` });
      }
    });
    activity.sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.json({ memorials, aggregate, activity: activity.slice(0, 5) });
  } catch (error) {
    console.error('getOverview error:', error);
    return res.status(500).json({ message: 'Failed to retrieve dashboard overview' });
  }
};