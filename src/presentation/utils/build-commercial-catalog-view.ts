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

function rowFromChange(entry: ConfigChangeEntry, currentValue: string): CommercialCatalogRow {
  let status: CommercialCatalogRowStatus = 'changed';
  if (entry.previousValue == null && entry.newValue != null) status = 'added';
  if (entry.previousValue != null && entry.newValue == null) status = 'removed';

  return {
    id: entry.id,
    label: entry.label,
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
        ? rowFromChange(change, current)
        : unchangedRow(id, field.label, current)
    );
  }

  return {
    category: 'valores_iniciales',
    title: 'Valores iniciales (web)',
    rows,
    changedCount: rows.filter((r) => r.status !== 'unchanged').length,
  };
}

function buildMaterialSection(
  snapshot: ConfigSyncSnapshot,
  byId: Map<string, ConfigChangeEntry>
): CommercialCatalogSection {
  const rows: CommercialCatalogRow[] = [];
  const seen = new Set<string>();

  const sorted = [...snapshot.materialTypes].sort(
    (a, b) => a.code.localeCompare(b.code) || Number(b.isActive) - Number(a.isActive)
  );

  for (const mat of sorted) {
    const code = mat.code.toUpperCase();
    seen.add(code);
    const current = `${code} · ${mat.isActive ? 'Activo' : 'Inactivo'}`;
    const change =
      byId.get(`mat.add.${code}`) ??
      byId.get(`mat.status.${code}`) ??
      byId.get(`mat.remove.${code}`);
    rows.push(
      change ? rowFromChange(change, current) : unchangedRow(`mat.${code}`, `Tipo MAT «${code}»`, current)
    );
  }

  for (const [id, entry] of byId) {
    if (!id.startsWith('mat.remove.')) continue;
    const code = id.slice('mat.remove.'.length);
    if (seen.has(code)) continue;
    rows.push(rowFromChange(entry, '—'));
  }

  return {
    category: 'tipo_mat',
    title: 'Tipos de material (web)',
    rows,
    changedCount: rows.filter((r) => r.status !== 'unchanged').length,
  };
}

function buildMaquilaSection(
  snapshot: ConfigSyncSnapshot,
  byId: Map<string, ConfigChangeEntry>
): CommercialCatalogSection {
  const rows: CommercialCatalogRow[] = [];
  const seen = new Set<string>();

  const sorted = [...snapshot.maquilaRanges].sort((a, b) =>
    a.minLeyOzTc.localeCompare(b.minLeyOzTc, undefined, { numeric: true })
  );

  for (const range of sorted) {
    const key = maquilaRangeKey(range.minLeyOzTc, range.maxLeyOzTc);
    seen.add(key);
    const label = `Maquila ${range.minLeyOzTc}–${range.maxLeyOzTc} oz/tc`;
    const current = `${range.maquila}${range.isActive ? '' : ' (inactivo)'}`;
    const change =
      byId.get(`maquila.add.${key}`) ??
      byId.get(`maquila.${key}`) ??
      byId.get(`maquila.remove.${key}`);
    rows.push(
      change ? rowFromChange(change, current) : unchangedRow(`maquila.${key}`, label, current)
    );
  }

  for (const [id, entry] of byId) {
    if (!id.startsWith('maquila.remove.')) continue;
    const key = id.slice('maquila.remove.'.length);
    if (seen.has(key)) continue;
    rows.push(rowFromChange(entry, '—'));
  }

  return {
    category: 'maquila',
    title: 'Rangos de maquila (web)',
    rows,
    changedCount: rows.filter((r) => r.status !== 'unchanged').length,
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
