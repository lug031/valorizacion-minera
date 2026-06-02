import type { SyncMetadata } from '../../services/sync/sync-config.types';

/** Hay cambios en changelog no vistos desde la última visita a Actualizaciones comerciales. */
export function hasUnreadCommercialUpdates(
  metadata: SyncMetadata | null,
  lastSeenChangelogSyncAt: string | null
): boolean {
  const changelog = metadata?.configChangelog;
  if (!changelog?.syncAt || !changelog.entries.length) return false;
  if (!lastSeenChangelogSyncAt) return true;
  return changelog.syncAt > lastSeenChangelogSyncAt;
}

export function unreadCommercialUpdatesCount(
  metadata: SyncMetadata | null,
  lastSeenChangelogSyncAt: string | null
): number {
  if (!hasUnreadCommercialUpdates(metadata, lastSeenChangelogSyncAt)) return 0;
  return metadata?.configChangelog?.entries.length ?? 0;
}
