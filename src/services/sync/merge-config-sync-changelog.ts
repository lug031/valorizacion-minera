import type { ConfigChangeEntry, ConfigSyncChangelog } from './config-sync-changelog.types';
import type { ConfigSyncSnapshot } from './config-sync-snapshot';
import {
  isConfigChangeEntryAtReferenceBaseline,
} from './config-reference-baseline';
import {
  COMMERCIAL_SETTINGS_FIELDS,
  formatCatalogValue,
  maquilaRangeKey,
} from './commercial-catalog-fields';

function norm(value: string | null | undefined): string {
  return String(value ?? '').trim().replace(',', '.');
}

function materialCodeFromChangeId(id: string): string | null {
  for (const prefix of ['mat.add.', 'mat.status.', 'mat.remove.']) {
    if (id.startsWith(prefix)) return id.slice(prefix.length);
  }
  return null;
}

function maquilaKeyFromChangeId(id: string): string | null {
  if (id.startsWith('maquila.add.')) return id.slice('maquila.add.'.length);
  if (id.startsWith('maquila.remove.')) return id.slice('maquila.remove.'.length);
  if (id.startsWith('maquila.')) return id.slice('maquila.'.length);
  return null;
}

function settingsEntryStillValid(entry: ConfigChangeEntry, snapshot: ConfigSyncSnapshot): boolean {
  const fieldKey = entry.id.slice('settings.'.length);
  const field = COMMERCIAL_SETTINGS_FIELDS.find((f) => f.key === fieldKey);
  if (!field) return false;

  const raw = snapshot.appSettings?.[field.key] ?? null;
  const formatted = formatCatalogValue(raw, field.format);
  const current = formatted === '—' ? null : formatted;

  if (entry.newValue === null) return current === null;
  return norm(current) === norm(entry.newValue);
}

function materialEntryStillValid(entry: ConfigChangeEntry, snapshot: ConfigSyncSnapshot): boolean {
  const code = materialCodeFromChangeId(entry.id);
  if (!code) return false;

  const mat = snapshot.materialTypes.find((m) => m.code.toUpperCase() === code);

  if (entry.id.startsWith('mat.remove.')) {
    return !mat;
  }
  if (entry.id.startsWith('mat.add.')) {
    return Boolean(mat);
  }
  if (entry.id.startsWith('mat.status.')) {
    if (!mat) return false;
    const state = mat.isActive ? 'Activo' : 'Inactivo';
    return norm(entry.newValue) === norm(state);
  }
  return false;
}

function maquilaEntryStillValid(entry: ConfigChangeEntry, snapshot: ConfigSyncSnapshot): boolean {
  const key = maquilaKeyFromChangeId(entry.id);
  if (!key) return false;

  const range = snapshot.maquilaRanges.find(
    (r) => maquilaRangeKey(r.minLeyOzTc, r.maxLeyOzTc) === key
  );

  if (entry.id.startsWith('maquila.remove.')) {
    return !range;
  }
  if (entry.id.startsWith('maquila.add.')) {
    return Boolean(range);
  }
  if (!range) return false;

  const current = range.isActive ? range.maquila : `${range.maquila} (inactivo)`;
  return norm(entry.newValue) === norm(current);
}

export function isConfigChangeEntryStillValid(
  entry: ConfigChangeEntry,
  snapshot: ConfigSyncSnapshot
): boolean {
  if (isConfigChangeEntryAtReferenceBaseline(entry, snapshot)) {
    return false;
  }
  if (entry.id.startsWith('settings.')) {
    return settingsEntryStillValid(entry, snapshot);
  }
  if (entry.id.startsWith('mat.')) {
    return materialEntryStillValid(entry, snapshot);
  }
  if (entry.id.startsWith('maquila.')) {
    return maquilaEntryStillValid(entry, snapshot);
  }
  return false;
}

const CATEGORY_ORDER: Record<ConfigChangeEntry['category'], number> = {
  valores_iniciales: 0,
  tipo_mat: 1,
  maquila: 2,
};

/**
 * Conserva el último cambio conocido por id hasta que ese valor vuelva a cambiar
 * o deje de coincidir con el catálogo actual.
 */
export function mergeConfigSyncChangelog(
  previous: ConfigSyncChangelog | null | undefined,
  delta: ConfigSyncChangelog,
  snapshotAfter: ConfigSyncSnapshot
): ConfigSyncChangelog {
  const byId = new Map<string, ConfigChangeEntry>();

  for (const entry of previous?.entries ?? []) {
    if (isConfigChangeEntryStillValid(entry, snapshotAfter)) {
      byId.set(entry.id, entry);
    }
  }

  for (const entry of delta.entries) {
    if (isConfigChangeEntryStillValid(entry, snapshotAfter)) {
      byId.set(entry.id, entry);
    } else {
      byId.delete(entry.id);
    }
  }

  const entries = [...byId.values()].sort((a, b) => {
    const cat = CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
    if (cat !== 0) return cat;
    return a.label.localeCompare(b.label, undefined, { numeric: true });
  });

  return {
    syncAt: delta.syncAt,
    entries,
  };
}
