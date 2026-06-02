import {
  formatPeruDate,
  formatPeruDateTime,
  PERU_LOCALE,
  PERU_TIMEZONE,
} from '../../utils/peru-datetime';

/** Formato monetario legible para resultados en pantalla. */
export function formatMoney(value: string | number | null | undefined): string {
  if (value == null || value === '') return '—';
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat(PERU_LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatTms(value: string | null | undefined): string {
  if (value == null || value === '') return '—';
  return value;
}

/** Fecha YYYY-MM-DD o ISO → formato legible en calendario Perú. */
export function formatDisplayDate(value: string | null | undefined): string {
  return formatPeruDate(value);
}

/** Fecha y hora legibles en zona horaria Perú. */
export function formatDisplayDateTime(iso: string | null | undefined): string {
  return formatPeruDateTime(iso);
}

export { PERU_LOCALE, PERU_TIMEZONE };
