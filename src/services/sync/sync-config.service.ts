import { getSqlExecutor } from '../../data/db/database';
import { sqliteSyncMetadataRepository } from '../../data/repositories/sqlite-sync-metadata-repository';
import type { AppActor } from '../../domain/models/app-actor';
import {
  canSyncMasterConfig,
  SYNC_ACCESS_DENIED_MESSAGE,
} from '../../domain/identity/sync-access';
import { runEnrollmentGraphql } from '../../infrastructure/amplify/mobile-enrollment-client';
import { getCloudDeviceId } from '../../infrastructure/device/enrollment-store';
import { getDeviceFingerprintHash } from '../device/device-fingerprint.service';
import { getValidDeviceSessionToken } from '../device/device-session-token.service';
import { assertPublishedConfigBundle, BundleValidationError } from './sync-config-bundle';
import { syncCloudPayloadSchema, type SyncCloudPayload } from './sync-config.schemas';
import { buildConfigSyncChangelog } from './build-config-sync-changelog';
import { mergeConfigSyncChangelog } from './merge-config-sync-changelog';
import { pruneConfigChangelog } from './config-reference-baseline';
import { captureConfigSnapshot } from './config-sync-snapshot';
import type { ConfigSyncChangelog } from './config-sync-changelog.types';
import type { SyncConfigResult, SyncMetadata, SyncStatus } from './sync-config.types';
import { configPayloadChecksum, isConfigBundleUnchanged } from './sync-config-checksum';

function mapAdminNotesToMetadataJson(
  metadataJson: string | null | undefined,
  notes: string | null | undefined
): string | null {
  if (metadataJson?.trim()) return metadataJson.trim();
  if (notes?.trim()) return JSON.stringify({ notes: notes.trim() });
  return null;
}

type GetMobileConfigBundleRow = {
  getMobileConfigBundle?: (SyncCloudPayload & {
    serverTime?: string;
  }) | null;
};

const GET_MOBILE_CONFIG_BUNDLE = /* GraphQL */ `
  query GetMobileConfigBundle(
    $cloudDeviceId: ID!
    $deviceFingerprintHash: String!
    $sessionToken: String!
  ) {
    getMobileConfigBundle(
      cloudDeviceId: $cloudDeviceId
      deviceFingerprintHash: $deviceFingerprintHash
      sessionToken: $sessionToken
    ) {
      materialTypes {
        id
        code
        label
        isActive
        sortOrder
        notes
        metadataJson
        updatedAt
      }
      maquilaRanges {
        id
        minLeyOzTc
        maxLeyOzTc
        maquila
        sortOrder
        isActive
        notes
        updatedAt
      }
      providers {
        id
        name
        isActive
        updatedAt
      }
      providerDefaults {
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
      appSettings {
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
      serverTime
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

async function fetchCloudConfig(): Promise<SyncCloudPayload> {
  const cloudDeviceId = await getCloudDeviceId();
  if (!cloudDeviceId) {
    throw new Error('No se encontró dispositivo activado para sincronizar configuración.');
  }
  const deviceFingerprintHash = await getDeviceFingerprintHash();
  const sessionToken = await getValidDeviceSessionToken({
    cloudDeviceId,
    deviceFingerprintHash,
  });

  const data = await runEnrollmentGraphql<GetMobileConfigBundleRow>(GET_MOBILE_CONFIG_BUNDLE, {
    cloudDeviceId,
    deviceFingerprintHash,
    sessionToken,
  });
  const payload = data.getMobileConfigBundle;
  if (!payload) {
    throw new Error('Respuesta inválida de AppSync durante sincronización.');
  }

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
    configChangelog?: ConfigSyncChangelog | null;
    preserveConfigChangelog?: ConfigSyncChangelog | null;
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
    rawChecksum: configPayloadChecksum(payload),
    configChangelog:
      options?.configChangelog ??
      options?.preserveConfigChangelog ??
      null,
  };
}

async function persistPayload(payload: SyncCloudPayload): Promise<void> {
  const db = await getSqlExecutor();
  await db.withTransaction(async () => {
    await db.run('DELETE FROM material_types');
    for (const row of payload.materialTypes) {
      await db.run(
        `INSERT INTO material_types (id, code, label, is_active, sort_order, metadata_json, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          row.id,
          row.code,
          row.label,
          row.isActive === false ? 0 : 1,
          row.sortOrder ?? 0,
          mapAdminNotesToMetadataJson(row.metadataJson, row.notes),
          row.updatedAt ?? null,
        ]
      );
    }

    await db.run('DELETE FROM maquila_ranges');
    for (const row of payload.maquilaRanges) {
      await db.run(
        `INSERT INTO maquila_ranges (id, min_ley_oz_tc, max_ley_oz_tc, maquila, sort_order, is_active, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          row.id,
          row.minLeyOzTc,
          row.maxLeyOzTc,
          row.maquila,
          row.sortOrder ?? 0,
          row.isActive === false ? 0 : 1,
          row.updatedAt ?? null,
        ]
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

export async function syncMasterConfig(actor: AppActor): Promise<SyncConfigResult> {
  if (!canSyncMasterConfig(actor.role)) {
    throw new Error(SYNC_ACCESS_DENIED_MESSAGE);
  }

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

    if (isConfigBundleUnchanged(previous, payload)) {
      const snapshotNow = await captureConfigSnapshot();
      const prunedChangelog = pruneConfigChangelog(previous.configChangelog, snapshotNow);
      const metadata: SyncMetadata = {
        ...previous,
        status: 'success',
        errorMessage: null,
        validationIssues: [],
        bundleVersion: bundle.bundleVersion ?? previous.bundleVersion,
        configChangelog: prunedChangelog,
      };
      await sqliteSyncMetadataRepository.saveConfigMetadata(metadata);
      return { metadata };
    }

    const snapshotBefore = await captureConfigSnapshot();
    await persistPayload(payload);
    const snapshotAfter = await captureConfigSnapshot();
    const syncAt = new Date().toISOString();
    const deltaChangelog = buildConfigSyncChangelog(snapshotBefore, snapshotAfter, syncAt);
    const configChangelog =
      pruneConfigChangelog(
        mergeConfigSyncChangelog(previous.configChangelog, deltaChangelog, snapshotAfter),
        snapshotAfter
      ) ?? null;

    const metadata = buildMetadata(payload, 'success', null, {
      bundleVersion: bundle.bundleVersion,
      validationIssues: [],
      configChangelog,
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
        preserveConfigChangelog: previous.configChangelog,
      });
      await sqliteSyncMetadataRepository.saveConfigMetadata(failedMetadata);
      throw err instanceof BundleValidationError ? err : new Error(message);
    }

    const failedMetadata: SyncMetadata = {
      ...previous,
      status,
      errorMessage: message,
      validationIssues: [message],
      configChangelog: previous.configChangelog,
    };
    await sqliteSyncMetadataRepository.saveConfigMetadata(failedMetadata);
    throw new Error(message);
  }
}
