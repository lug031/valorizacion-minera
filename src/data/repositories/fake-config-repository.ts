import { FALLBACK_MATERIAL_TYPES } from '../../domain/constants/expected-mat-codes';
import { DEFAULT_MAQUILA_RANGES } from '../../domain/constants/default-maquila-ranges';
import type {
  AppSettings,
  MaquilaRange,
  MaterialType,
  Provider,
} from '../../domain/models/config';
import type { ConfigRepository } from './config-repository';

const MATERIAL_TYPES: MaterialType[] = [...FALLBACK_MATERIAL_TYPES];

export const fakeConfigRepository: ConfigRepository = {
  async getMaterialTypes(activeOnly = true) {
    return activeOnly ? MATERIAL_TYPES.filter((m) => m.isActive) : MATERIAL_TYPES;
  },

  async getMaquilaRanges(activeOnly = true) {
    const ranges: MaquilaRange[] = DEFAULT_MAQUILA_RANGES.map((r, i) => ({
      ...r,
      id: `maquila-${i}`,
      sortOrder: i,
      isActive: true,
    }));
    return activeOnly ? ranges.filter((r) => r.isActive !== false) : ranges;
  },

  async saveMaquilaRanges(_ranges) {
    /* mock: no-op hasta SQLite */
  },

  async getProviders(activeOnly = true) {
    const all: Provider[] = [
      { id: 'p1', name: 'Proveedor Demo', isActive: true },
    ];
    return activeOnly ? all.filter((p) => p.isActive) : all;
  },

  async getProviderDefaults(_providerId) {
    return null;
  },

  async getAppSettings() {
    const s: AppSettings = {
      id: 'default',
      factor: '1',
      defaultRecPercentGold: '90',
      defaultRecPercentSilver: '85',
      updatedAt: new Date().toISOString(),
    };
    return s;
  },

  async saveAppSettings(_settings) {
    /* mock */
  },
};
