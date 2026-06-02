/** Locale y zona horaria oficiales para la app (Perú). */
export const PERU_LOCALE = 'es-PE';
export const PERU_TIMEZONE = 'America/Lima';

const PERU_DATETIME: Intl.DateTimeFormatOptions = {
  timeZone: PERU_TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

const PERU_DATE: Intl.DateTimeFormatOptions = {
  timeZone: PERU_TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
};

function parseInstant(iso: string): Date | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Fecha y hora en Perú (America/Lima). */
export function formatPeruDateTime(iso: string | null | undefined): string {
  if (iso == null || iso === '') return '—';
  const d = parseInstant(iso);
  if (!d) return iso;
  return new Intl.DateTimeFormat(PERU_LOCALE, PERU_DATETIME).format(d);
}

/** Solo fecha en Perú (America/Lima). */
export function formatPeruDate(iso: string | null | undefined): string {
  if (iso == null || iso === '') return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso.trim())) {
    const [y, m, day] = iso.trim().split('-');
    return `${day}/${m}/${y}`;
  }
  const d = parseInstant(iso);
  if (!d) return iso;
  return new Intl.DateTimeFormat(PERU_LOCALE, PERU_DATE).format(d);
}

/** Fecha calendario local Perú como YYYY-MM-DD (p. ej. cotización del día). */
export function todayIsoDatePeru(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: PERU_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}
