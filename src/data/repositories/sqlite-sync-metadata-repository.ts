import type { SqlExecutor } from '../db/sql-executor';
import { getSqlExecutor } from '../db/database';
import type { ConfigSyncChangelog } from '../../services/sync/config-sync-changelog.types';
import type { SyncMetadata, SyncStatus } from '../../services/sync/sync-config.types';

interface SyncMetadataRow {
  key: 'config';
  last_sync_at: string | null;
  status: SyncStatus;
  error_message: string | null;
  bundle_version: string | null;
  validation_issues_json: string | null;
  records_material_types: number;
  records_maquila_ranges: number;
  records_providers: number;
  records_provider_defaults: number;
  records_app_settings: number;
  max_updated_at_material_types: string | null;
  max_updated_at_maquila_ranges: string | null;
  max_updated_at_providers: string | null;
  max_updated_at_provider_defaults: string | null;
  max_updated_at_app_settings: string | null;
  raw_checksum: string | null;
  config_changelog_json: string | null;
}

function parseChangelog(json: string | null): ConfigSyncChangelog | null {
  if (!json?.trim()) return null;
  try {
    const parsed = JSON.parse(json) as ConfigSyncChangelog;
    if (!parsed?.syncAt || !Array.isArray(parsed.entries)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function parseIssues(json: string | null): string[] {
  if (!json?.trim()) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function mapRow(row: SyncMetadataRow): SyncMetadata {
  return {
    key: 'config',
    lastSyncAt: row.last_sync_at,
    status: row.status,
    errorMessage: row.error_message,
    bundleVersion: row.bundle_version ?? null,
    validationIssues: parseIssues(row.validation_issues_json),
    recordsMaterialTypes: row.records_material_types,
    recordsMaquilaRanges: row.records_maquila_ranges,
    recordsProviders: row.records_providers,
    recordsProviderDefaults: row.records_provider_defaults,
    recordsAppSettings: row.records_app_settings,
    maxUpdatedAtMaterialTypes: row.max_updated_at_material_types,
    maxUpdatedAtMaquilaRanges: row.max_updated_at_maquila_ranges,
    maxUpdatedAtProviders: row.max_updated_at_providers,
    maxUpdatedAtProviderDefaults: row.max_updated_at_provider_defaults,
    maxUpdatedAtAppSettings: row.max_updated_at_app_settings,
    rawChecksum: row.raw_checksum,
    configChangelog: parseChangelog(row.config_changelog_json),
  };
}

function defaultMetadata(): SyncMetadata {
  return {
    key: 'config',
    lastSyncAt: null,
    status: 'idle',
    errorMessage: null,
    bundleVersion: null,
    validationIssues: [],
    recordsMaterialTypes: 0,
    recordsMaquilaRanges: 0,
    recordsProviders: 0,
    recordsProviderDefaults: 0,
    recordsAppSettings: 0,
    maxUpdatedAtMaterialTypes: null,
    maxUpdatedAtMaquilaRanges: null,
    maxUpdatedAtProviders: null,
    maxUpdatedAtProviderDefaults: null,
    maxUpdatedAtAppSettings: null,
    rawChecksum: null,
    configChangelog: null,
  };
}

async function getByKey(db: SqlExecutor): Promise<SyncMetadata | null> {
  const row = await db.getFirst<SyncMetadataRow>('SELECT * FROM sync_metadata WHERE key = ?', ['config']);
  return row ? mapRow(row) : null;
}

export const sqliteSyncMetadataRepository = {
  async getConfigMetadata(): Promise<SyncMetadata> {
    const db = await getSqlExecutor();
    const metadata = await getByKey(db);
    return metadata ?? defaultMetadata();
  },

  async saveConfigMetadata(metadata: SyncMetadata): Promise<void> {
    const db = await getSqlExecutor();
    await db.run(
      `INSERT OR REPLACE INTO sync_metadata (
        key, last_sync_at, status, error_message, bundle_version, validation_issues_json,
        records_material_types, records_maquila_ranges, records_providers, records_provider_defaults, records_app_settings,
        max_updated_at_material_types, max_updated_at_maquila_ranges, max_updated_at_providers, max_updated_at_provider_defaults, max_updated_at_app_settings,
        raw_checksum, config_changelog_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        metadata.key,
        metadata.lastSyncAt,
        metadata.status,
        metadata.errorMessage,
        metadata.bundleVersion,
        JSON.stringify(metadata.validationIssues),
        metadata.recordsMaterialTypes,
        metadata.recordsMaquilaRanges,
        metadata.recordsProviders,
        metadata.recordsProviderDefaults,
        metadata.recordsAppSettings,
        metadata.maxUpdatedAtMaterialTypes,
        metadata.maxUpdatedAtMaquilaRanges,
        metadata.maxUpdatedAtProviders,
        metadata.maxUpdatedAtProviderDefaults,
        metadata.maxUpdatedAtAppSettings,
        metadata.rawChecksum,
        metadata.configChangelog ? JSON.stringify(metadata.configChangelog) : null,
      ]
    );
  },
};
