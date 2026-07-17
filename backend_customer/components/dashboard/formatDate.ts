// components/dashboard/formatDate.ts
// Shared by MemorialRailCard, StatTile callers and ActivityFeed. Lives here
// rather than in the page because the components that need it are no longer
// in the page.

/**
 * Format an API date string for display. Returns an em dash for null,
 * empty, or unparseable values so a bad row renders as "—" instead of
 * "Invalid Date".
 *
 * Note: the API sends `date` columns pre-formatted via to_char(...,'YYYY-MM-DD')
 * — node-postgres would otherwise hand back JS Date objects and mangle them.
 */
export function formatDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}