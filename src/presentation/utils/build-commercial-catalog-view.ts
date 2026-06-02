import type { ConfigChangeEntry, ConfigChangeCategory } from '../../services/sync/config-sync-changelog.types';
import type { ConfigSyncChangelog } from '../../services/sync/config-sync-changelog.types';
import type { ConfigSyncSnapshot } from '../../services/sync/config-sync-snapshot';
import {
  COMMERCIAL_SETTINGS_FIELDS,
  formatCatalogValue,
  maquilaRangeKey,
} from '../../services/sync/commercial-catalog-fields';

export type CommercialCatalogRowStatus = 'unchanged' | 'changed' | 'added' | 'removed';

export interface CommercialCatalogRow {
  id: string;
  label: string;
  status: CommercialCatalogRowStatus;
  currentValue: string;
  previousValue: string | null;
  newValue: string | null;
  previousRecordedAt: string | null;
  newRecordedAt: string | null;
}

export interface CommercialCatalogSection {
  category: ConfigChangeCategory;
  title: string;
  /** Catálogo completo (valores iniciales) o solo entradas con cambios (MAT / maquila). */
  displayMode: 'full_catalog' | 'changes_only';
  rows: CommercialCatalogRow[];
  changedCount: number;
}

function changelogById(changelog: ConfigSyncChangelog | null | undefined): Map<string, ConfigChangeEntry> {
  const map = new Map<string, ConfigChangeEntry>();
  for (const entry of changelog?.entries ?? []) {
    map.set(entry.id, entry);
  }
  return map;
}

function rowFromChange(entry: ConfigChangeEntry, currentValue: string, label: string): CommercialCatalogRow {
  let status: CommercialCatalogRowStatus = 'changed';
  if (entry.previousValue == null && entry.newValue != null) status = 'added';
  if (entry.previousValue != null && entry.newValue == null) status = 'removed';

  return {
    id: entry.id,
    label,
    status,
    currentValue,
    previousValue: entry.previousValue,
    newValue: entry.newValue,
    previousRecordedAt: entry.previousRecordedAt,
    newRecordedAt: entry.newRecordedAt,
  };
}

function unchangedRow(id: string, label: string, currentValue: string): CommercialCatalogRow {
  return {
    id,
    label,
    status: 'unchanged',
    currentValue,
    previousValue: null,
    newValue: null,
    previousRecordedAt: null,
    newRecordedAt: null,
  };
}

function materialCodeFromChangeId(id: string): string | null {
  for (const prefix of ['mat.add.', 'mat.status.', 'mat.remove.']) {
    if (id.startsWith(prefix)) return id.slice(prefix.length);
  }
  return null;
}

function materialLabel(code: string): string {
  return `Tipo MAT «${code}»`;
}

function maquilaKeyFromChangeId(id: string): string | null {
  if (id.startsWith('maquila.add.')) return id.slice('maquila.add.'.length);
  if (id.startsWith('maquila.remove.')) return id.slice('maquila.remove.'.length);
  if (id.startsWith('maquila.')) return id.slice('maquila.'.length);
  return null;
}

function maquilaLabelFromKey(key: string): string {
  const [min, max] = key.split('|');
  return `Maquila ${min}–${max} oz/tc`;
}

function buildSettingsSection(
  snapshot: ConfigSyncSnapshot,
  byId: Map<string, ConfigChangeEntry>
): CommercialCatalogSection {
  const rows: CommercialCatalogRow[] = [];

  for (const field of COMMERCIAL_SETTINGS_FIELDS) {
    const raw = snapshot.appSettings?.[field.key] ?? null;
    const current = formatCatalogValue(raw, field.format);
    const id = `settings.${field.key}`;
    const change = byId.get(id);
    rows.push(
      change
        ? rowFromChange(change, current, field.label)
        : unchangedRow(id, field.label, current)
    );
  }

  return {
    category: 'valores_iniciales',
    title: 'Valores iniciales',
    displayMode: 'full_catalog',
    rows,
    changedCount: rows.filter((r) => r.status !== 'unchanged').length,
  };
}

function buildMaterialSection(
  snapshot: ConfigSyncSnapshot,
  byId: Map<string, ConfigChangeEntry>
): CommercialCatalogSection {
  const rows: CommercialCatalogRow[] = [];

  for (const entry of byId.values()) {
    if (entry.category !== 'tipo_mat') continue;
    const code = materialCodeFromChangeId(entry.id);
    if (!code) continue;

    const mat = snapshot.materialTypes.find((m) => m.code.toUpperCase() === code);
    const current = mat
      ? `${code} · ${mat.isActive ? 'Activo' : 'Inactivo'}`
      : entry.newValue ?? entry.previousValue ?? '—';

    rows.push(rowFromChange(entry, current, materialLabel(code)));
  }

  rows.sort((a, b) => a.label.localeCompare(b.label));

  return {
    category: 'tipo_mat',
    title: 'Tipos de material',
    displayMode: 'changes_only',
    rows,
    changedCount: rows.length,
  };
}

function buildMaquilaSection(
  snapshot: ConfigSyncSnapshot,
  byId: Map<string, ConfigChangeEntry>
): CommercialCatalogSection {
  const rows: CommercialCatalogRow[] = [];

  for (const entry of byId.values()) {
    if (entry.category !== 'maquila') continue;
    const key = maquilaKeyFromChangeId(entry.id);
    if (!key) continue;

    const range = snapshot.maquilaRanges.find(
      (r) => maquilaRangeKey(r.minLeyOzTc, r.maxLeyOzTc) === key
    );
    const current = range
      ? `${range.maquila}${range.isActive ? '' : ' (inactivo)'}`
      : entry.newValue ?? entry.previousValue ?? '—';

    rows.push(rowFromChange(entry, current, maquilaLabelFromKey(key)));
  }

  rows.sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));

  return {
    category: 'maquila',
    title: 'Rangos de maquila',
    displayMode: 'changes_only',
    rows,
    changedCount: rows.length,
  };
}

export function buildCommercialCatalogView(
  snapshot: ConfigSyncSnapshot,
  changelog: ConfigSyncChangelog | null | undefined
): CommercialCatalogSection[] {
  const byId = changelogById(changelog);
  return [
    buildSettingsSection(snapshot, byId),
    buildMaterialSection(snapshot, byId),
    buildMaquilaSection(snapshot, byId),
  ];
}

export function countCatalogChanges(sections: CommercialCatalogSection[]): number {
  return sections.reduce((sum, s) => sum + s.changedCount, 0);
}

export function countCatalogRows(sections: CommercialCatalogSection[]): number {
  return sections.reduce((sum, s) => sum + s.rows.length, 0);
}
