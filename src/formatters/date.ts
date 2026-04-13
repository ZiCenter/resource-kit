import { format, parseISO } from 'date-fns';

export function formatDate(value: any, dateFormat = 'dd MMM yyyy'): string {
  if (!value) return '';

  // Date arrays: [year, month, day]
  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day] = value;
    const date = new Date(year, month - 1, day);
    return format(date, dateFormat);
  }

  // ISO string
  if (typeof value === 'string') {
    try {
      return format(parseISO(value), dateFormat);
    } catch {
      return value;
    }
  }

  // Timestamp
  if (typeof value === 'number') {
    return format(new Date(value), dateFormat);
  }

  return String(value);
}

export function toApiDate(date: Date, dateFormat = 'yyyy-MM-dd'): string {
  return format(date, dateFormat);
}
