/**
 * Format milliseconds into HH:MM:SS string.
 */
export function formatTimeRemaining(ms) {
  if (ms <= 0) return '00:00:00';

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds].map((v) => String(v).padStart(2, '0')).join(':');
}

/**
 * Format a date string to a human-readable format.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format a time string.
 */
export function formatTime(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format seat list for display: ['F11', 'F12', 'F13'] → "F11, F12, F13"
 */
export function formatSeats(seats) {
  if (!seats || seats.length === 0) return 'No seats';
  return seats.join(', ');
}

/**
 * Truncate text to a max length.
 */
export function truncate(str, maxLen = 50) {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '...';
}
