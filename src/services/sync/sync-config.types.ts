export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

export interface SyncMetadata {
  key: 'config';
  lastSyncAt: string | null;
  status: SyncStatus;
  errorMessage: string | null;
  /** Versión/fingerprint del último bundle cloud validado o intentado. */
  bundleVersion: string | null;
  /** Lista legible de problemas del último intento (JSON en SQLite). */
  validationIssues: string[];
  recordsMaterialTypes: number;
  recordsMaquilaRanges: number;
  recordsProviders: number;
  recordsProviderDefaults: number;
  recordsAppSettings: number;
  maxUpdatedAtMaterialTypes: string | null;
  maxUpdatedAtMaquilaRanges: string | null;
  maxUpdatedAtProviders: string | null;
  maxUpdatedAtProviderDefaults: string | null;
  maxUpdatedAtAppSettings: string | null;
  rawChecksum: string | null;
}

export interface SyncConfigResult {
  metadata: SyncMetadata;
}
