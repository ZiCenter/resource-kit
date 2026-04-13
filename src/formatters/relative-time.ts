/**
 * Converts a date value to a human-readable relative time string.
 * Handles date arrays [year, month, day], ISO strings, and timestamps.
 */
export function formatRelativeTime(value: unknown): string {
  const date = toDate(value);
  if (!date) return '';

  const now = Date.now();
  const diffMs = now - date.getTime();
  if (diffMs < 0) return 'just now';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo${months > 1 ? 's' : ''} ago`;

  const years = Math.floor(months / 12);
  return `${years} yr${years > 1 ? 's' : ''} ago`;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;

  // Date arrays: [year, month, day] or [year, month, day, hour, min, sec]
  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day, hour = 0, min = 0, sec = 0] = value;
    return new Date(year, month - 1, day, hour, min, sec);
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === 'number') {
    return new Date(value);
  }

  return null;
}
