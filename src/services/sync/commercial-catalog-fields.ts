import type { ConfigSyncSnapshot } from './config-sync-snapshot';

export const COMMERCIAL_SETTINGS_FIELDS: Array<{
  key: keyof NonNullable<ConfigSyncSnapshot['appSettings']>;
  label: string;
  format?: (v: string) => string;
}> = [
  { key: 'factor', label: 'Factor comercial' },
  { key: 'defaultRecPercentGold', label: 'REC oro (%)' },
  { key: 'defaultRecPercentSilver', label: 'REC plata (%)' },
  { key: 'defaultRcGold', label: 'RC oro', format: (v) => `US$ ${v}` },
  { key: 'defaultRcSilver', label: 'RC plata', format: (v) => `US$ ${v}` },
  { key: 'defaultConsumos', label: 'Consumos', format: (v) => `US$ ${v}` },
  { key: 'defaultFlete', label: 'Flete', format: (v) => `US$ ${v}` },
  { key: 'defaultInterGold', label: 'INTER oro', format: (v) => `US$ ${v}` },
  { key: 'defaultInterSilver', label: 'INTER plata', format: (v) => `US$ ${v}` },
];

export function formatCatalogValue(
  value: string | null | undefined,
  format?: (v: string) => string
): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '—';
  return format ? format(raw) : raw;
}

export function maquilaRangeKey(min: string, max: string): string {
  return `${String(min).trim().replace(',', '.')}|${String(max).trim().replace(',', '.')}`;
}
