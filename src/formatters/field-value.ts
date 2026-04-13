import type { DetailFieldDef } from '@zicenter/form-kit';
import { formatDate } from './date';

const EMPTY = '—';

function getPath(entity: any, path: string): unknown {
  return path.split('.').reduce((acc: any, key: string) => acc?.[key], entity);
}

/**
 * Extracts a value from an entity using a dot-separated path
 * and applies type-specific formatting.
 */
export function resolveFieldValue(entity: any, field: DetailFieldDef): string {
  const raw = getPath(entity, field.key);

  if (field.format) {
    const result = field.format(raw, entity);
    return result == null || result === '' ? EMPTY : result;
  }

  if (raw === undefined || raw === null || raw === '') return EMPTY;

  switch (field.type) {
    case 'date':
      return formatDate(raw);
    case 'currency': {
      const num = Number(raw);
      if (Number.isNaN(num)) return String(raw);
      const formatted = num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      const symbol = field.currencyKey ? (getPath(entity, field.currencyKey) as string) : undefined;
      return symbol ? `${symbol} ${formatted}` : formatted;
    }
    case 'percent': {
      const num = Number(raw);
      return Number.isNaN(num) ? String(raw) : `${num}%`;
    }
    case 'boolean':
      return raw ? 'Yes' : 'No';
    default:
      return String(raw);
  }
}
