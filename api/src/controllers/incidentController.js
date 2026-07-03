const { getConnection, runQuery } = require('../db/connectionManager');

/**
 * GET /api/incidents
 * Fetch incident listing (SOFT DELETE FILTERED)
 */
const getIncidents = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);

  try {
    const sql = `
      SELECT
        i.id,
        i.title,
        i.description,
        i.victim,
        i.date,
        i.time,
        i.location,
        i.status,
        i.no_victim,
        i.reference_link,
        COUNT(c.id)::int AS message_count
      FROM public.mt_incident i
      LEFT JOIN public."mt_incident-comment" c
        ON c."incident_id"::int = i.id
      WHERE i.show = TRUE
      GROUP BY
        i.id,
        i.title,
        i.description,
        i.victim,
        i.date,
        i.time,
        i.location,
        i.status,
        i.no_victim,
        i.reference_link
      ORDER BY i.id ASC
    `;

    const rows = await runQuery(db, sql);

    const incidents = rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      victim: row.victim,
      date_of_incident: row.date,
      time: row.time,
      location: row.location,
      status: row.status,
      casualty_count: row.no_victim,
      reference_link: row.reference_link,
      message_count: row.message_count,
    }));

    return res.status(200).json({
      success: true,
      data: incidents,
    });
  } catch (err) {
    console.error('getIncidents error:', err);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch incidents',
      error: err.message,
    });
  }
};

/**
 * GET /api/incidents/:id
 * Fetch single incident (SOFT DELETE SAFE)
 */
const getIncidentById = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  const { id } = req.params;

  try {
    const incidentSql = `
      SELECT
        id,
        title,
        description,
        victim,
        date::text AS date,
        time::text AS time,
        location,
        status,
        no_victim,
        reference_link
      FROM public.mt_incident
      WHERE id = $1 AND show = TRUE
      LIMIT 1
    `;

    const incidentRows = await runQuery(db, incidentSql, [id]);

    if (!incidentRows.length) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found',
      });
    }

    const commentsSql = `
      SELECT
        id,
        "incident_id" AS incident_id,
        email,
        name,
        message,
        create_date::text AS create_date,
        icon
      FROM public."mt_incident-comment"
      WHERE "incident_id"::int = $1
      ORDER BY id ASC
    `;

    const commentRows = await runQuery(db, commentsSql, [id]);

    const row = incidentRows[0];

    const incident = {
      id: row.id,
      title: row.title,
      description: row.description,
      victim: row.victim,
      date_of_incident: row.date,
      time: row.time,
      location: row.location,
      status: row.status,
      casualty_count: row.no_victim,
      reference_link: row.reference_link,
      message_count: commentRows.length,
      comments: commentRows,
    };

    return res.status(200).json({
      success: true,
      data: incident,
    });
  } catch (err) {
    console.error('getIncidentById error:', err);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch incident detail',
      error: err.message,
    });
  }
};

/**
 * DELETE /api/incidents/:id
 * SOFT DELETE (NO HARD DELETE)
 */
const deleteIncident = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  const { id } = req.params;

  try {
    const rows = await runQuery(
      db,
      `
      UPDATE public.mt_incident
      SET show = FALSE
      WHERE id = $1
      RETURNING id
      `,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Incident soft deleted successfully',
    });
  } catch (err) {
    console.error('deleteIncident error:', err);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete incident',
      error: err.message,
    });
  }
};

/**
 * POST /api/incidents
 */
const createIncident = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);

  try {
    const {
      title,
      description,
      victim,
      date_of_incident,
      time,
      location,
      status,
      casualty_count,
      reference_link,
    } = req.body;

    const sql = `
      INSERT INTO public.mt_incident
      (
        title,
        description,
        victim,
        date,
        time,
        location,
        status,
        no_victim,
        reference_link,
        show
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE)
      RETURNING
        id,
        title,
        description,
        victim,
        date,
        time,
        location,
        status,
        no_victim,
        reference_link
    `;

    const rows = await runQuery(db, sql, [
      title || '',
      description || '',
      victim || '',
      date_of_incident || null,
      time || null,
      location || '',
      status || 'ACTIVE',
      casualty_count || '0',
      reference_link || '',
    ]);

    const row = rows[0];

    return res.status(201).json({
      success: true,
      message: 'Incident created successfully',
      data: {
        id: row.id,
        title: row.title,
        description: row.description,
        victim: row.victim,
        date_of_incident: row.date,
        time: row.time,
        location: row.location,
        status: row.status,
        casualty_count: row.no_victim,
        reference_link: row.reference_link,
        message_count: 0,
      },
    });
  } catch (err) {
    console.error('createIncident error:', err);

    return res.status(500).json({
      success: false,
      message: 'Failed to create incident',
      error: err.message,
    });
  }
};

/**
 * PUT /api/incidents/:id
 */
const updateIncident = async (req, res) => {
  const db = getConnection(process.env.DB_TYPE);
  const { id } = req.params;

  try {
    const {
      title,
      description,
      victim,
      date_of_incident,
      time,
      location,
      status,
      casualty_count,
      reference_link,
    } = req.body;

    const sql = `
      UPDATE public.mt_incident
      SET
        title = $1,
        description = $2,
        victim = $3,
        date = $4,
        time = $5,
        location = $6,
        status = $7,
        no_victim = $8,
        reference_link = $9
      WHERE id = $10
      RETURNING
        id,
        title,
        description,
        victim,
        date,
        time,
        location,
        status,
        no_victim,
        reference_link
    `;

    const rows = await runQuery(db, sql, [
      title || '',
      description || '',
      victim || '',
      date_of_incident || null,
      time || null,
      location || '',
      status || 'ACTIVE',
      casualty_count || '0',
      reference_link || '',
      id,
    ]);

    if (!rows.length) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found',
      });
    }

    const row = rows[0];

    return res.status(200).json({
      success: true,
      message: 'Incident updated successfully',
      data: {
        id: row.id,
        title: row.title,
        description: row.description,
        victim: row.victim,
        date_of_incident: row.date,
        time: row.time,
        location: row.location,
        status: row.status,
        casualty_count: row.no_victim,
        reference_link: row.reference_link,
        message_count: 0,
      },
    });
  } catch (err) {
    console.error('updateIncident error:', err);

    return res.status(500).json({
      success: false,
      message: 'Failed to update incident',
      error: err.message,
    });
  }
};

module.exports = {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident,
};