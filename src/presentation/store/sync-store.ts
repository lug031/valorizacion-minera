import { create } from 'zustand';
import { syncMasterConfig, getSyncMetadata } from '../../services/sync/sync-config.service';
import type { SyncMetadata } from '../../services/sync/sync-config.types';
import { SYNC_ACCESS_DENIED_MESSAGE } from '../utils/role-access';
import { useAuthStore } from './auth-store';
import { useConfigStore } from './config-store';
import { useSettingsStore } from './settings-store';

interface SyncState {
  metadata: SyncMetadata | null;
  loading: boolean;
  hydrating: boolean;
  hydrate: () => Promise<void>;
  syncNow: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set) => ({
  metadata: null,
  loading: false,
  hydrating: false,

  hydrate: async () => {
    set({ hydrating: true });
    try {
      const metadata = await getSyncMetadata();
      set({ metadata, hydrating: false });
    } catch {
      set({ hydrating: false });
    }
  },

  syncNow: async () => {
    const actor = useAuthStore.getState().user;
    if (!actor) {
      set({ loading: false });
      return;
    }

    set({ loading: true });
    try {
      const result = await syncMasterConfig(actor);
      await Promise.all([
        useConfigStore.getState().hydrate(),
        useSettingsStore.getState().hydrateFromDb(),
      ]);
      set({ metadata: result.metadata, loading: false });
    } catch (err) {
      const metadata = await getSyncMetadata();
      const message = err instanceof Error ? err.message : SYNC_ACCESS_DENIED_MESSAGE;
      if (message === SYNC_ACCESS_DENIED_MESSAGE) {
        set({
          metadata: {
            ...metadata,
            status: 'error',
            errorMessage: message,
            validationIssues: [message],
          },
          loading: false,
        });
        return;
      }
      set({ metadata, loading: false });
      // No relanzar: la UI muestra el error en metadata.errorMessage.
    }
  },
}));
