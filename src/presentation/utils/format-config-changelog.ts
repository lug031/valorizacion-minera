import type { ConfigChangeEntry } from '../../services/sync/config-sync-changelog.types';
import { formatPeruDateTime } from '../../utils/peru-datetime';

export function formatConfigChangeTimestamp(iso: string | null | undefined): string {
  return formatPeruDateTime(iso);
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
