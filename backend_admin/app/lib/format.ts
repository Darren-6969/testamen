// Human-readable file size, e.g. 2411724 -> "2.3 MB". Bytes shown whole,
// larger units to one decimal.
export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const val = bytes / Math.pow(1024, i);
  return `${i === 0 ? Math.round(val) : val.toFixed(1)} ${units[i]}`;
}

// Readable date, e.g. "12 Jul 2026". Falls back to the raw value if unparseable.
export function formatDate(value?: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}