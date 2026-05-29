/** Formato monetario legible para resultados en pantalla. */
export function formatMoney(value: string | number | null | undefined): string {
  if (value == null || value === '') return '—';
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatTms(value: string | null | undefined): string {
  if (value == null || value === '') return '—';
  return value;
}

/** Fecha YYYY-MM-DD o ISO → formato legible (es-PE). */
export function formatDisplayDate(value: string | null | undefined): string {
  if (value == null || value === '') return '—';
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split('-');
    return `${d}/${m}/${y}`;
  }
  return formatDisplayDateTime(trimmed);
}

/** Fecha y hora legibles para pantallas (no ISO crudo). */
export function formatDisplayDateTime(iso: string | null | undefined): string {
  if (iso == null || iso === '') return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}
