// scripts/backfill_video_posters.js
// One-off: generate posters for mt_video rows uploaded before poster generation existed. 
// New uploads get one automatically (see videoController.uploadVideos).
//
//   cd api
//   node scripts/backfill_video_posters.js            # only rows with no poster
//   node scripts/backfill_video_posters.js --force    # regenerate all posters
//   node scripts/backfill_video_posters.js --dry-run  # report only, no writes
//
// Safe to re-run: posters use a stable filename and are overwritten, never accumulated. 
// Audio rows are skipped (no frames to extract).

require('dotenv').config();
const fs = require('fs');

const { initConnections, getConnection, runQuery } = require('../src/db/connectionManager');
const { generatePoster, hasFfmpeg } = require('../src/utils/videoPoster');
const { diskPath } = require('../src/utils/memorialUpload');

const FORCE = process.argv.includes('--force');
const DRY = process.argv.includes('--dry-run');

(async () => {
  try {
    if (!hasFfmpeg()) {
      console.error('ffmpeg-static is not installed. Run:  npm install ffmpeg-static');
      process.exit(1);
    }

    await initConnections();
    const db = getConnection(process.env.DB_TYPE);

    const rows = await runQuery(
      db,
      `SELECT id, filename, poster
         FROM mt_video
        WHERE deleted_at IS NULL
          AND media_type = 'video'
          ${FORCE ? '' : 'AND (poster IS NULL OR poster = \'\')'}
        ORDER BY id`,
      []
    );

    console.log(`${rows.length} video row(s) to process${DRY ? ' (dry run)' : ''}.`);

    let made = 0;
    let missing = 0;
    let failed = 0;

    for (const r of rows) {
      const p = diskPath('videos', r.filename);

      if (!fs.existsSync(p)) {
        // Row points at a file that isn't on disk (e.g. DB restored from a
        // backup without the uploads folder). Nothing to extract from.
        console.warn(`  id=${r.id}  MISSING FILE  ${r.filename}`);
        missing++;
        continue;
      }

      if (DRY) {
        console.log(`  id=${r.id}  would generate poster for ${r.filename}`);
        continue;
      }

      const poster = await generatePoster(p);
      if (!poster) {
        console.warn(`  id=${r.id}  FAILED        ${r.filename}`);
        failed++;
        continue;
      }

      await runQuery(db, `UPDATE mt_video SET poster = $1 WHERE id = $2`, [poster, r.id]);
      console.log(`  id=${r.id}  ok            ${poster}`);
      made++;
    }

    console.log(
      `\nDone. ${made} poster(s) generated, ${failed} failed, ${missing} row(s) with no file on disk.`
    );
    process.exit(0);
  } catch (err) {
    console.error('backfill_video_posters error:', err);
    process.exit(1);
  }
})();