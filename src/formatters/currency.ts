export function formatCurrency(
  value: number | null | undefined,
  currencyCode = 'USD',
  locale = 'en-US',
): string {
  if (value == null) return '';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(value);
}
