import { create } from 'zustand';
import type { MaquilaRange, MaterialType } from '../../domain/models/config';
import { configRepository } from '../../data/repositories';

interface ConfigState {
  maquilaRanges: MaquilaRange[];
  materialTypes: MaterialType[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  maquilaRanges: [],
  materialTypes: [],
  isHydrated: false,

  hydrate: async () => {
    const [maquilaRanges, materialTypes] = await Promise.all([
      configRepository.getMaquilaRanges(),
      configRepository.getMaterialTypes(),
    ]);
    set({ maquilaRanges, materialTypes, isHydrated: true });
  },
}));
