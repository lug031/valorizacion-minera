import * as SecureStore from 'expo-secure-store';

const KEY = 'vm_last_seen_changelog_sync_at';

export async function getLastSeenChangelogSyncAt(): Promise<string | null> {
  return SecureStore.getItemAsync(KEY);
}

export async function setLastSeenChangelogSyncAt(syncAt: string): Promise<void> {
  await SecureStore.setItemAsync(KEY, syncAt);
}
