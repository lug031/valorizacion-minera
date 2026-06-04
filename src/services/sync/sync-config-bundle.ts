import { EXPECTED_MAT_CODES } from '../../domain/constants/expected-mat-codes';
import type { SyncCloudPayload } from './sync-config.schemas';

export { EXPECTED_MAT_CODES };

export const MIN_ACTIVE_MAQUILA_RANGES = 1;

export interface BundleCatalogCounts {
  materialTypes: number;
  materialTypesActive: number;
  maquilaRanges: number;
  maquilaRangesActive: number;
  providers: number;
  providerDefaults: number;
  appSettingsDefault: number;
}

export interface PublishedBundleValidation {
  isValid: boolean;
  bundleVersion: string | null;
  counts: BundleCatalogCounts;
  issues: string[];
}

export class BundleValidationError extends Error {
  readonly validation: PublishedBundleValidation;

  constructor(validation: PublishedBundleValidation) {
    const summary = validation.issues.join('\n• ');
    super(`Bundle de configuración incompleto o no publicado.\n• ${summary}`);
    this.name = 'BundleValidationError';
    this.validation = validation;
  }
}

function countCatalogs(payload: SyncCloudPayload): BundleCatalogCounts {
  const materialTypesActive = payload.materialTypes.filter((m) => m.isActive !== false).length;
  const maquilaRangesActive = payload.maquilaRanges.filter((m) => m.isActive !== false).length;
  const appSettingsDefault = payload.appSettings.filter((s) => s.settingsKey === 'default').length;

  return {
    materialTypes: payload.materialTypes.length,
    materialTypesActive,
    maquilaRanges: payload.maquilaRanges.length,
    maquilaRangesActive,
    providers: payload.providers.length,
    providerDefaults: payload.providerDefaults.length,
    appSettingsDefault,
  };
}

function computeBundleVersion(payload: SyncCloudPayload, counts: BundleCatalogCounts): string {
  const defaultSettings = payload.appSettings.find((s) => s.settingsKey === 'default');
  const parts = [
    `mat:${counts.materialTypesActive}`,
    `maq:${counts.maquilaRangesActive}`,
    `prov:${counts.providers}`,
    `defs:${counts.providerDefaults}`,
    `factor:${defaultSettings?.factor ?? 'na'}`,
    `matMax:${maxUpdatedAt(payload.materialTypes)}`,
    `maqMax:${maxUpdatedAt(payload.maquilaRanges)}`,
    `setMax:${defaultSettings?.updatedAt ?? 'na'}`,
  ];
  return parts.join('|');
}

function maxUpdatedAt(rows: Array<{ updatedAt?: string | null }>): string {
  const values = rows.map((r) => r.updatedAt ?? null).filter((v): v is string => Boolean(v)).sort();
  return values.length ? values[values.length - 1] : 'none';
}

/**
 * Valida que el payload cloud sea un bundle maestro completo y publicable.
 * No toca SQLite: solo reglas de negocio previas a la transacción.
 */
export function validatePublishedConfigBundle(payload: SyncCloudPayload): PublishedBundleValidation {
  const issues: string[] = [];
  const counts = countCatalogs(payload);

  // 1) MaterialType
  if (counts.materialTypes === 0) {
    issues.push('MaterialType vacío. Cree tipos MAT en la web: /admin/materiales.');
  } else if (counts.materialTypesActive === 0) {
    issues.push('MaterialType sin registros activos. Active al menos un tipo MAT.');
  }

  // 2) MaquilaRange
  if (counts.maquilaRanges === 0) {
    issues.push('MaquilaRange vacío. Cree rangos en la web: /admin/maquila.');
  } else {
    const activeValid = payload.maquilaRanges.filter(
      (r) =>
        r.isActive !== false &&
        r.minLeyOzTc.trim() !== '' &&
        r.maxLeyOzTc.trim() !== '' &&
        r.maquila.trim() !== ''
    );
    if (activeValid.length < MIN_ACTIVE_MAQUILA_RANGES) {
      issues.push(
        `MaquilaRange incompleto. Se requiere al menos ${MIN_ACTIVE_MAQUILA_RANGES} rango activo con ley mín/máx y maquila válidos.`
      );
    }
  }

  // 3) AppSettings singleton default
  const defaultSettingsRows = payload.appSettings.filter((s) => s.settingsKey === 'default');
  if (defaultSettingsRows.length === 0) {
    issues.push('AppSettings sin registro default. Configure /admin/configuracion.');
  } else if (defaultSettingsRows.length > 1) {
    issues.push('AppSettings inválido: hay más de un registro con settingsKey=default.');
  } else {
    const settings = defaultSettingsRows[0];
    if (!settings.factor?.trim()) {
      issues.push('AppSettings default inválido: factor comercial vacío.');
    }
  }

  // 4) ProviderDefaults huérfanos
  const providerIds = new Set(payload.providers.map((p) => p.id));
  const orphanDefault = payload.providerDefaults.find((d) => !providerIds.has(d.providerId));
  if (orphanDefault) {
    issues.push(
      `ProviderDefaults huérfano: providerId=${orphanDefault.providerId} no existe en Provider.`
    );
  }

  // 5) Versión / publicación del bundle
  if (issues.length > 0) {
    return { isValid: false, bundleVersion: null, counts, issues };
  }

  const bundleVersion = computeBundleVersion(payload, counts);
  if (!bundleVersion || bundleVersion.includes('factor:na')) {
    issues.push('Bundle sin versión/publicación válida (factor o timestamps de catálogo incompletos).');
    return { isValid: false, bundleVersion: null, counts, issues };
  }

  return {
    isValid: true,
    bundleVersion,
    counts,
    issues: [],
  };
}

export function assertPublishedConfigBundle(payload: SyncCloudPayload): PublishedBundleValidation {
  const validation = validatePublishedConfigBundle(payload);
  if (!validation.isValid) {
    throw new BundleValidationError(validation);
  }
  return validation;
}
