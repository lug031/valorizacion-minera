export interface FieldUserMobileSyncRow {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'operador';
  isActive: boolean;
  notes?: string | null;
  metadataJson?: string | null;
  mobilePasswordHash: string;
  updatedAt?: string | null;
}

export interface SyncFieldUsersResult {
  upserted: number;
  deactivated: number;
  skippedSeedConflicts: number;
  lastSyncAt: string;
  errorMessage?: string | null;
}
