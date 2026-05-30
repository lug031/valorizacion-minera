import { getSqlExecutor } from '../../data/db/database';
import { sqliteSyncMetadataRepository } from '../../data/repositories/sqlite-sync-metadata-repository';
import { ensureSyncIdentity, getMobileDataClient } from '../../infrastructure/amplify/mobile-data-client';
import { assertPublishedConfigBundle, BundleValidationError } from './sync-config-bundle';
import { syncCloudPayloadSchema, type SyncCloudPayload } from './sync-config.schemas';
import type { SyncConfigResult, SyncMetadata, SyncStatus } from './sync-config.types';

const LIST_MATERIAL_TYPES = /* GraphQL */ `
  query ListMaterialTypesForMobile {
    listMaterialTypes(limit: 500) {
      items {
        id
        code
        label
        isActive
        sortOrder
        notes
        metadataJson
        updatedAt
      }
    }
  }
`;

const LIST_MAQUILA_RANGES = /* GraphQL */ `
  query ListMaquilaRangesForMobile {
    listMaquilaRanges(limit: 500) {
      items {
        id
        minLeyOzTc
        maxLeyOzTc
        maquila
        sortOrder
        isActive
        notes
        updatedAt
      }
    }
  }
`;

function mapAdminNotesToMetadataJson(
  metadataJson: string | null | undefined,
  notes: string | null | undefined
): string | null {
  if (metadataJson?.trim()) return metadataJson.trim();
  if (notes?.trim()) return JSON.stringify({ notes: notes.trim() });
  return null;
}

const LIST_PROVIDERS = /* GraphQL */ `
  query ListProvidersForMobile {
    listProviders(limit: 500) {
      items {
        id
        name
        isActive
        updatedAt
      }
    }
  }
`;

const LIST_PROVIDER_DEFAULTS = /* GraphQL */ `
  query ListProviderDefaultsForMobile {
    listProviderDefaults(limit: 500) {
      items {
        id
        providerId
        recPercentGold
        recPercentSilver
        rcGold
        rcSilver
        consumos
        flete
        interGold
        interSilver
        factor
        updatedAt
      }
    }
  }
`;

const LIST_APP_SETTINGS = /* GraphQL */ `
  query ListAppSettingsForMobile {
    listAppSettings(limit: 50) {
      items {
        id
        settingsKey
        factor
        defaultConsumos
        defaultFlete
        defaultRcGold
        defaultRcSilver
        defaultRecPercentGold
        defaultRecPercentSilver
        defaultInterGold
        defaultInterSilver
        interGoldSource
        interSilverSource
        interGoldFetchedAt
        interSilverFetchedAt
        interFetchStatus
        interFetchError
        updatedAt
      }
    }
  }
`;

function mapGraphQLErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : 'Error desconocido de sincronización';
  const lowered = msg.toLowerCase();
  if (
    lowered.includes('network') ||
    lowered.includes('offline') ||
    lowered.includes('timed out') ||
    lowered.includes('internet')
  ) {
    return 'Sin conexión a internet. Se mantiene la configuración local.';
  }
  if (lowered.includes('not authorized') || lowered.includes('unauthorized')) {
    return 'No tiene permisos para sincronizar configuración.';
  }
  return msg;
}

function maxUpdatedAt(rows: Array<{ updatedAt?: string | null }>): string | null {
  const values = rows.map((r) => r.updatedAt ?? null).filter((v): v is string => Boolean(v)).sort();
  return values.length ? values[values.length - 1] : null;
}

function checksum(payload: SyncCloudPayload): string {
  return JSON.stringify(payload);
}

async function fetchCloudConfig(): Promise<SyncCloudPayload> {
  await ensureSyncIdentity();
  const mobileDataClient = getMobileDataClient();

  const runQuery = async <T>(query: string): Promise<T> => {
    const result = (await mobileDataClient.graphql({ query })) as {
      data?: T;
      errors?: Array<{ message?: string }>;
    };
    if (result.errors?.length) {
      throw new Error(result.errors.map((e) => e.message ?? 'Error GraphQL').join('; '));
    }
    if (!result.data) {
      throw new Error('Respuesta inválida de AppSync durante sincronización.');
    }
    return result.data;
  };

  const [materialTypesResult, maquilaRangesResult, providersResult, providerDefaultsResult, appSettingsResult] = await Promise.all([
    runQuery<{ listMaterialTypes?: { items?: unknown[] } }>(LIST_MATERIAL_TYPES),
    runQuery<{ listMaquilaRanges?: { items?: unknown[] } }>(LIST_MAQUILA_RANGES),
    runQuery<{ listProviders?: { items?: unknown[] } }>(LIST_PROVIDERS),
    runQuery<{ listProviderDefaults?: { items?: unknown[] } }>(LIST_PROVIDER_DEFAULTS),
    runQuery<{ listAppSettings?: { items?: unknown[] } }>(LIST_APP_SETTINGS),
  ]);

  const payload = {
    materialTypes: materialTypesResult.listMaterialTypes?.items ?? [],
    maquilaRanges: maquilaRangesResult.listMaquilaRanges?.items ?? [],
    providers: providersResult.listProviders?.items ?? [],
    providerDefaults: providerDefaultsResult.listProviderDefaults?.items ?? [],
    appSettings: appSettingsResult.listAppSettings?.items ?? [],
  };

  return syncCloudPayloadSchema.parse(payload);
}

function countAppliedAppSettings(payload: SyncCloudPayload): number {
  return payload.appSettings.some((row) => row.settingsKey === 'default') ? 1 : 0;
}

function buildMetadata(
  payload: SyncCloudPayload,
  status: SyncStatus,
  errorMessage: string | null,
  options?: {
    bundleVersion?: string | null;
    validationIssues?: string[];
    preserveLastSyncAt?: string | null;
  }
): SyncMetadata {
  return {
    key: 'config',
    lastSyncAt:
      status === 'success'
        ? new Date().toISOString()
        : options?.preserveLastSyncAt ?? null,
    status,
    errorMessage,
    bundleVersion: options?.bundleVersion ?? null,
    validationIssues: options?.validationIssues ?? [],
    recordsMaterialTypes: payload.materialTypes.length,
    recordsMaquilaRanges: payload.maquilaRanges.length,
    recordsProviders: payload.providers.length,
    recordsProviderDefaults: payload.providerDefaults.length,
    recordsAppSettings: countAppliedAppSettings(payload),
    maxUpdatedAtMaterialTypes: maxUpdatedAt(payload.materialTypes),
    maxUpdatedAtMaquilaRanges: maxUpdatedAt(payload.maquilaRanges),
    maxUpdatedAtProviders: maxUpdatedAt(payload.providers),
    maxUpdatedAtProviderDefaults: maxUpdatedAt(payload.providerDefaults),
    maxUpdatedAtAppSettings: maxUpdatedAt(payload.appSettings),
    rawChecksum: checksum(payload),
  };
}

async function persistPayload(payload: SyncCloudPayload): Promise<void> {
  const db = await getSqlExecutor();
  await db.withTransaction(async () => {
    await db.run('DELETE FROM material_types');
    for (const row of payload.materialTypes) {
      await db.run(
        `INSERT INTO material_types (id, code, label, is_active, sort_order, metadata_json)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          row.id,
          row.code,
          row.label,
          row.isActive === false ? 0 : 1,
          row.sortOrder ?? 0,
          mapAdminNotesToMetadataJson(row.metadataJson, row.notes),
        ]
      );
    }

    await db.run('DELETE FROM maquila_ranges');
    for (const row of payload.maquilaRanges) {
      await db.run(
        `INSERT INTO maquila_ranges (id, min_ley_oz_tc, max_ley_oz_tc, maquila, sort_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [row.id, row.minLeyOzTc, row.maxLeyOzTc, row.maquila, row.sortOrder ?? 0, row.isActive === false ? 0 : 1]
      );
    }

    await db.run('DELETE FROM providers');
    for (const row of payload.providers) {
      await db.run(`INSERT INTO providers (id, name, is_active) VALUES (?, ?, ?)`, [
        row.id,
        row.name,
        row.isActive === false ? 0 : 1,
      ]);
    }

    await db.run('DELETE FROM provider_defaults');
    for (const row of payload.providerDefaults) {
      await db.run(
        `INSERT INTO provider_defaults (
          provider_id, rec_percent_gold, rec_percent_silver, rc_gold, rc_silver, consumos, flete, inter_gold, inter_silver, factor
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row.providerId,
          row.recPercentGold ?? null,
          row.recPercentSilver ?? null,
          row.rcGold ?? null,
          row.rcSilver ?? null,
          row.consumos ?? null,
          row.flete ?? null,
          row.interGold ?? null,
          row.interSilver ?? null,
          row.factor ?? null,
        ]
      );
    }

    await db.run('DELETE FROM app_settings');
    const appSettings = payload.appSettings.find((row) => row.settingsKey === 'default');
    if (!appSettings) {
      throw new Error('No se encontró AppSettings default para persistir.');
    }
    await db.run(
      `INSERT INTO app_settings (
        id, factor, default_consumos, default_flete, default_rc_gold, default_rc_silver, default_rec_percent_gold,
        default_rec_percent_silver, default_inter_gold, default_inter_silver,
        inter_gold_source, inter_silver_source, inter_gold_fetched_at, inter_silver_fetched_at,
        inter_fetch_status, inter_fetch_error, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'default',
        appSettings.factor,
        appSettings.defaultConsumos ?? null,
        appSettings.defaultFlete ?? null,
        appSettings.defaultRcGold ?? null,
        appSettings.defaultRcSilver ?? null,
        appSettings.defaultRecPercentGold ?? null,
        appSettings.defaultRecPercentSilver ?? null,
        appSettings.defaultInterGold ?? null,
        appSettings.defaultInterSilver ?? null,
        appSettings.interGoldSource ?? null,
        appSettings.interSilverSource ?? null,
        appSettings.interGoldFetchedAt ?? null,
        appSettings.interSilverFetchedAt ?? null,
        appSettings.interFetchStatus ?? null,
        appSettings.interFetchError ?? null,
        appSettings.updatedAt ?? new Date().toISOString(),
      ]
    );
  });
}

export async function getSyncMetadata(): Promise<SyncMetadata> {
  return sqliteSyncMetadataRepository.getConfigMetadata();
}

export async function syncMasterConfig(): Promise<SyncConfigResult> {
  const previous = await sqliteSyncMetadataRepository.getConfigMetadata();
  await sqliteSyncMetadataRepository.saveConfigMetadata({
    ...previous,
    status: 'syncing',
    errorMessage: null,
    validationIssues: [],
  });

  let payload: SyncCloudPayload | null = null;

  try {
    payload = await fetchCloudConfig();

    // Validación de bundle completo ANTES de cualquier escritura SQLite de catálogos.
    const bundle = assertPublishedConfigBundle(payload);

    await persistPayload(payload);

    const metadata = buildMetadata(payload, 'success', null, {
      bundleVersion: bundle.bundleVersion,
      validationIssues: [],
    });
    await sqliteSyncMetadataRepository.saveConfigMetadata(metadata);
    return { metadata };
  } catch (err) {
    const message = mapGraphQLErrorMessage(err);
    const status: SyncStatus = message.toLowerCase().includes('sin conexión') ? 'offline' : 'error';

    if (payload) {
      const issues =
        err instanceof BundleValidationError
          ? err.validation.issues
          : [message];

      const failedMetadata = buildMetadata(payload, status, message, {
        bundleVersion:
          err instanceof BundleValidationError ? err.validation.bundleVersion : null,
        validationIssues: issues,
        preserveLastSyncAt: previous.lastSyncAt,
      });
      await sqliteSyncMetadataRepository.saveConfigMetadata(failedMetadata);
      throw err instanceof BundleValidationError ? err : new Error(message);
    }

    const failedMetadata: SyncMetadata = {
      ...previous,
      status,
      errorMessage: message,
      validationIssues: [message],
    };
    await sqliteSyncMetadataRepository.saveConfigMetadata(failedMetadata);
    throw new Error(message);
  }
}
