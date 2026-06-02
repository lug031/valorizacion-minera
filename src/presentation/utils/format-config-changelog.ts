import type { ConfigChangeEntry } from '../../services/sync/config-sync-changelog.types';

export function formatConfigChangeTimestamp(iso: string | null | undefined): string {
  if (!iso?.trim()) return '—';
  try {
    return new Date(iso).toLocaleString('es-PE', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}

export function formatConfigChangeValue(value: string | null | undefined): string {
  if (value == null || value.trim() === '') return '—';
  return value;
}

const CATEGORY_LABELS: Record<ConfigChangeEntry['category'], string> = {
  valores_iniciales: 'Valores iniciales (web)',
  tipo_mat: 'Tipos de material',
  maquila: 'Rangos de maquila',
};

export function configChangeCategoryLabel(category: ConfigChangeEntry['category']): string {
  return CATEGORY_LABELS[category];
}
