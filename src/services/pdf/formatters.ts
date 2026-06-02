import { formatPeruDate, formatPeruDateTime, PERU_LOCALE } from '../../utils/peru-datetime';

/** Formato monetario — 2 decimales (es-PE). */
export function formatPdfMoney(value: string | number | null | undefined): string {
  if (value == null || value === '') return '—';
  const n = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat(PERU_LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/** TMS y leyes — hasta 6 decimales significativos, mínimo 3 para TMS típico. */
export function formatPdfDecimal(
  value: string | number | null | undefined,
  decimals = 3
): string {
  if (value == null || value === '') return '—';
  const n = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat(PERU_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function formatPdfPercent(value: string | number | null | undefined): string {
  if (value == null || value === '') return '—';
  return `${value}%`;
}

export function formatPdfDate(isoOrDate: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoOrDate.trim())) {
    return formatPeruDate(isoOrDate);
  }
  return formatPeruDate(isoOrDate.includes('T') ? isoOrDate : `${isoOrDate}T12:00:00`);
}

export function formatPdfDateTime(iso: string): string {
  return formatPeruDateTime(iso);
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
