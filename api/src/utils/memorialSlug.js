// src/utils/memorialSlug.js
// Landing page -> Register module -> Step 1 "Create a memorial".
//
// Builds and reserves the unique memorial URL slug stored in mt_deceased.url_name.
// The full public URL (www.memodise.com/<slug>) is stored separately on
// mt_user_account.link at commit time; this module only owns the slug itself.
//
// Slug rules (agreed spec - deliberately differs from the legacy PHP, which did
// full_name.replace(/\s+/g, '_') and produced "Mohamad_Adam"):
//   "Mohamad Adam"             -> "mohamad-adam"
//   "R. Manickam a/l Suppiah"  -> "r-manickam-a-l-suppiah"
//   "Siti Aminah binti Yusof"  -> "siti-aminah-binti-yusof"
//   "José Álvarez"             -> "jose-alvarez"
//   collision                  -> "mohamad-adam-1", "mohamad-adam-2", ...
//
// Uniqueness note: mt_deceased.url_name is varchar(100) with NO unique index,
// and one cannot simply be added - the legacy data already contains duplicates
// (e.g. 'dd' appears on five rows, 'yyy' on others), so CREATE UNIQUE INDEX
// would fail until that is cleaned up. Uniqueness is therefore enforced here.
//
// Two entry points, used at different moments:
//   checkSlugAvailability() - Step 1, read-only, for the live "is this free?"
//                             hint under the URL field. Advisory only: a slug
//                             that is free while typing can be taken by the time
//                             the user reaches Step 3.
//   reserveSlug()           - Step 3, inside the commit transaction. Takes a
//                             Postgres transaction-scoped advisory lock keyed on
//                             the base slug, so two simultaneous registrations
//                             of the same name cannot both resolve to the same
//                             value. The lock is released automatically on
//                             COMMIT or ROLLBACK.

const { runQuery } = require('../db/connectionManager');

// mt_deceased.url_name is character varying(100).
const URL_NAME_MAX = 100;

// Safety valve so a pathological collision run cannot loop forever.
const MAX_COLLISION_ATTEMPTS = 500;

/**
 * Normalise a display name into a kebab-case slug.
 * Pure string function - no database access, safe to reuse on the client.
 */
function slugifyName(value) {
  const slug = String(value == null ? '' : value)
    .normalize('NFKD') // split accented chars into base + combining mark
    .replace(/[\u0300-\u036f]/g, '') // drop the combining marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // spaces, dots, slashes, apostrophes -> hyphen
    .replace(/-{2,}/g, '-') // collapse runs
    .replace(/^-+|-+$/g, ''); // trim the ends

  return trimToMax(slug, URL_NAME_MAX);
}

/**
 * Truncate to a byte/char budget without leaving a dangling hyphen.
 */
function trimToMax(slug, max) {
  if (slug.length <= max) return slug;
  return slug.slice(0, max).replace(/-+$/, '');
}

/**
 * Build the nth candidate for a base slug.
 * n = 0 -> the base itself; n >= 1 -> "<base>-<n>", truncated so the whole
 * thing still fits inside url_name's 100 characters.
 */
function buildCandidate(base, n) {
  if (n <= 0) return base;

  const suffix = `-${n}`;
  const room = URL_NAME_MAX - suffix.length;
  return `${trimToMax(base, room)}${suffix}`;
}

/**
 * Is this exact slug already used by any memorial?
 * Case-insensitive: the legacy rows are inconsistently cased ('TEST', 'Boy',
 * 'HoChoonHuat'), and URLs should not be case-sensitive.
 */
async function isSlugTaken(db, slug) {
  const rows = await runQuery(
    db,
    `SELECT 1 FROM mt_deceased WHERE LOWER(url_name) = LOWER($1) LIMIT 1`,
    [slug]
  );
  return Array.isArray(rows) && rows.length > 0;
}

/**
 * Walk base, base-1, base-2, ... until one is free.
 * Shared by the read-only check and the transactional reserve.
 */
async function findFreeSlug(db, base) {
  for (let n = 0; n < MAX_COLLISION_ATTEMPTS; n += 1) {
    const candidate = buildCandidate(base, n);
    // eslint-disable-next-line no-await-in-loop
    if (!(await isSlugTaken(db, candidate))) return candidate;
  }

  throw new Error(`Could not find a free memorial URL for "${base}".`);
}

/**
 * Step 1 - read-only availability hint.
 *
 * Accepts either a raw name or an already-slugified value; it slugifies again
 * so the client and server can never disagree about the final form.
 *
 * Returns:
 *   { input, slug, available, suggestion, reason }
 *   - slug       the normalised form of what the user typed
 *   - available  true when `slug` itself is free
 *   - suggestion the slug they would actually get (equals `slug` when free)
 *   - reason     'empty' when the input contains no usable characters
 */
async function checkSlugAvailability(db, value) {
  const slug = slugifyName(value);

  if (!slug) {
    return {
      input: String(value == null ? '' : value),
      slug: '',
      available: false,
      suggestion: '',
      reason: 'empty',
    };
  }

  const taken = await isSlugTaken(db, slug);
  const suggestion = taken ? await findFreeSlug(db, slug) : slug;

  return {
    input: String(value),
    slug,
    available: !taken,
    suggestion,
    reason: taken ? 'taken' : 'available',
  };
}

/**
 * Step 3 - authoritative reservation, called inside the commit transaction.
 *
 * Must be called after BEGIN. Takes pg_advisory_xact_lock on a hash of the base
 * slug so concurrent registrations of the same name serialise here rather than
 * both reading "free" and both inserting.
 *
 * Returns the final slug to write to mt_deceased.url_name.
 */
async function reserveSlug(db, value) {
  const base = slugifyName(value);

  if (!base) {
    throw new Error('A valid memorial URL could not be generated from that name.');
  }

  // Advisory locks are Postgres-only. These tables are Postgres, but runQuery is
  // multi-driver, so guard rather than assume.
  if (db && db.constructor && db.constructor.name === 'Client') {
    await runQuery(db, `SELECT pg_advisory_xact_lock(hashtext($1))`, [base]);
  }

  return findFreeSlug(db, base);
}

module.exports = {
  URL_NAME_MAX,
  slugifyName,
  buildCandidate,
  isSlugTaken,
  checkSlugAvailability,
  reserveSlug,
};