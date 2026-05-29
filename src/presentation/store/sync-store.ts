import { create } from 'zustand';
import { syncMasterConfig, getSyncMetadata } from '../../services/sync/sync-config.service';
import type { SyncMetadata } from '../../services/sync/sync-config.types';
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
    set({ loading: true });
    try {
      const result = await syncMasterConfig();
      await Promise.all([
        useConfigStore.getState().hydrate(),
        useSettingsStore.getState().hydrateFromDb(),
      ]);
      set({ metadata: result.metadata, loading: false });
    } catch {
      const metadata = await getSyncMetadata();
      set({ metadata, loading: false });
      // No relanzar: la UI muestra el error en metadata.errorMessage.
    }
  },
}));
