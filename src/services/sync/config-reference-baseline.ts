import { COTIZADOR_DEFAULTS } from '../../domain/constants/cotizador-defaults';
import { DEFAULT_MATERIAL_TYPES_CATALOG } from '../../domain/constants/expected-mat-codes';
import { DEFAULT_MAQUILA_RANGES } from '../../domain/constants/default-maquila-ranges';
import type { ConfigChangeEntry, ConfigSyncChangelog } from './config-sync-changelog.types';
import type { ConfigSyncSnapshot } from './config-sync-snapshot';
import {
  COMMERCIAL_SETTINGS_FIELDS,
  formatCatalogValue,
  maquilaRangeKey,
  normCommercialNumeric,
} from './commercial-catalog-fields';

/** Tipos MAT iniciales (schema SQLite / referencia web). */
export const REFERENCE_MATERIAL_TYPES = DEFAULT_MATERIAL_TYPES_CATALOG.map((m) => ({
  code: m.code,
  label: m.label,
  isActive: true as const,
}));

/** Catálogo de referencia alineado a COTIZADOR_DEFAULTS y seed del móvil / web. */
export function getReferenceConfigBaseline(): ConfigSyncSnapshot {
  return {
    appSettings: {
      factor: COTIZADOR_DEFAULTS.factor,
      defaultConsumos: COTIZADOR_DEFAULTS.consumos,
      defaultFlete: COTIZADOR_DEFAULTS.flete,
      defaultRcGold: COTIZADOR_DEFAULTS.rcGold,
      defaultRcSilver: COTIZADOR_DEFAULTS.rcSilver,
      defaultRecPercentGold: COTIZADOR_DEFAULTS.recPercentGold,
      defaultRecPercentSilver: COTIZADOR_DEFAULTS.recPercentSilver,
      defaultInterGold: COTIZADOR_DEFAULTS.interGold,
      defaultInterSilver: COTIZADOR_DEFAULTS.interSilver,
      updatedAt: null,
    },
    materialTypes: REFERENCE_MATERIAL_TYPES.map((m) => ({
      code: m.code,
      label: m.label,
      isActive: m.isActive,
      updatedAt: null,
    })),
    maquilaRanges: DEFAULT_MAQUILA_RANGES.map((r, index) => ({
      id: `ref-maquila-${index}`,
      minLeyOzTc: r.minLeyOzTc,
      maxLeyOzTc: r.maxLeyOzTc,
      maquila: r.maquila,
      isActive: true,
      updatedAt: null,
    })),
  };
}

function settingsFieldAtReference(
  fieldKey: string,
  snapshot: ConfigSyncSnapshot,
  baseline: ConfigSyncSnapshot
): boolean {
  const field = COMMERCIAL_SETTINGS_FIELDS.find((f) => f.key === fieldKey);
  if (!field || !baseline.appSettings) return false;

  const currentRaw = snapshot.appSettings?.[field.key] ?? null;
  const refRaw = baseline.appSettings[field.key] ?? null;
  const current = formatCatalogValue(currentRaw, field.format);
  const ref = formatCatalogValue(refRaw, field.format);
  return normCommercialNumeric(current === '—' ? '' : current) === normCommercialNumeric(ref === '—' ? '' : ref);
}

function materialCodeFromChangeId(id: string): string | null {
  for (const prefix of ['mat.add.', 'mat.status.', 'mat.remove.']) {
    if (id.startsWith(prefix)) return id.slice(prefix.length);
  }
  return null;
}

function materialStateAtReference(
  code: string,
  snapshot: ConfigSyncSnapshot,
  baseline: ConfigSyncSnapshot
): boolean {
  const ref = baseline.materialTypes.find((m) => m.code.toUpperCase() === code);
  const cur = snapshot.materialTypes.find((m) => m.code.toUpperCase() === code);
  if (!ref && !cur) return true;
  if (!ref || !cur) return false;
  return ref.isActive === cur.isActive;
}

function materialCatalogAtReference(
  snapshot: ConfigSyncSnapshot,
  baseline: ConfigSyncSnapshot
): boolean {
  const refCodes = new Set(baseline.materialTypes.map((m) => m.code.toUpperCase()));
  if (snapshot.materialTypes.length !== refCodes.size) return false;
  for (const code of refCodes) {
    if (!materialStateAtReference(code, snapshot, baseline)) return false;
  }
  return snapshot.materialTypes.every((m) => refCodes.has(m.code.toUpperCase()));
}

function maquilaKeyFromChangeId(id: string): string | null {
  const raw =
    id.startsWith('maquila.add.')
      ? id.slice('maquila.add.'.length)
      : id.startsWith('maquila.remove.')
        ? id.slice('maquila.remove.'.length)
        : id.startsWith('maquila.')
          ? id.slice('maquila.'.length)
          : null;
  if (!raw) return null;
  const [min, max] = raw.split('|');
  if (!min || !max) return raw;
  return maquilaRangeKey(min, max);
}

function maquilaRangeAtReference(
  key: string,
  snapshot: ConfigSyncSnapshot,
  baseline: ConfigSyncSnapshot
): boolean {
  const normalizedKey = maquilaKeyFromChangeId(`maquila.${key}`) ?? key;
  const ref = baseline.maquilaRanges.find(
    (r) => maquilaRangeKey(r.minLeyOzTc, r.maxLeyOzTc) === normalizedKey
  );
  const cur = snapshot.maquilaRanges.find(
    (r) => maquilaRangeKey(r.minLeyOzTc, r.maxLeyOzTc) === normalizedKey
  );
  if (!ref && !cur) return true;
  if (!ref || !cur) return false;
  return (
    normCommercialNumeric(ref.maquila) === normCommercialNumeric(cur.maquila) &&
    ref.isActive === cur.isActive
  );
}

function maquilaCatalogAtReference(
  snapshot: ConfigSyncSnapshot,
  baseline: ConfigSyncSnapshot
): boolean {
  if (snapshot.maquilaRanges.length !== baseline.maquilaRanges.length) return false;
  return baseline.maquilaRanges.every((ref) =>
    maquilaRangeAtReference(maquilaRangeKey(ref.minLeyOzTc, ref.maxLeyOzTc), snapshot, baseline)
  );
}

function settingsCatalogAtReference(
  snapshot: ConfigSyncSnapshot,
  baseline: ConfigSyncSnapshot
): boolean {
  return COMMERCIAL_SETTINGS_FIELDS.every((field) =>
    settingsFieldAtReference(field.key, snapshot, baseline)
  );
}

/** Todo el catálogo local coincide con la referencia del sistema. */
export function isConfigSnapshotAtReferenceBaseline(
  snapshot: ConfigSyncSnapshot,
  baseline: ConfigSyncSnapshot = getReferenceConfigBaseline()
): boolean {
  return (
    settingsCatalogAtReference(snapshot, baseline) &&
    materialCatalogAtReference(snapshot, baseline) &&
    maquilaCatalogAtReference(snapshot, baseline)
  );
}

/**
 * El valor actual coincide con la referencia del sistema (restaurado / estado inicial).
 * Esos cambios no deben mostrarse en Actualizaciones comerciales.
 */
export function isConfigChangeEntryAtReferenceBaseline(
  entry: ConfigChangeEntry,
  snapshot: ConfigSyncSnapshot,
  baseline: ConfigSyncSnapshot = getReferenceConfigBaseline()
): boolean {
  if (isConfigSnapshotAtReferenceBaseline(snapshot, baseline)) {
    return true;
  }
  if (entry.id.startsWith('settings.')) {
    return settingsFieldAtReference(entry.id.slice('settings.'.length), snapshot, baseline);
  }
  if (entry.id.startsWith('mat.')) {
    const code = materialCodeFromChangeId(entry.id);
    return code ? materialStateAtReference(code, snapshot, baseline) : false;
  }
  if (entry.id.startsWith('maquila.')) {
    const key = maquilaKeyFromChangeId(entry.id);
    return key ? maquilaRangeAtReference(key, snapshot, baseline) : false;
  }
  return false;
}

/** Elimina entradas obsoletas o ya restauradas a referencia. */
export function pruneConfigChangelog(
  changelog: ConfigSyncChangelog | null | undefined,
  snapshot: ConfigSyncSnapshot
): ConfigSyncChangelog | null {
  if (!changelog) return null;
  if (isConfigSnapshotAtReferenceBaseline(snapshot)) {
    return { syncAt: changelog.syncAt, entries: [] };
  }
  const entries = changelog.entries.filter(
    (entry) => !isConfigChangeEntryAtReferenceBaseline(entry, snapshot)
  );
  return { ...changelog, entries };
}

export function filterChangelogAgainstReferenceBaseline(
  changelog: ConfigSyncChangelog,
  snapshotAfter: ConfigSyncSnapshot
): ConfigSyncChangelog {
  return pruneConfigChangelog(changelog, snapshotAfter) ?? { syncAt: changelog.syncAt, entries: [] };
}
