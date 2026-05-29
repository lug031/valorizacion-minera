import { create } from 'zustand';
import { configRepository } from '../../data/repositories';
import { COTIZADOR_DEFAULTS } from '../../domain/constants/cotizador-defaults';
import type { AppSettings } from '../../domain/models/config';

export interface SettingsDefaults {
  factor: string;
  recPercentGold: string;
  recPercentSilver: string;
  rcGold: string;
  rcSilver: string;
  consumos: string;
  flete: string;
  interGold: string;
  interSilver: string;
}

const FALLBACK: SettingsDefaults = {
  factor: COTIZADOR_DEFAULTS.factor,
  recPercentGold: COTIZADOR_DEFAULTS.recPercentGold,
  recPercentSilver: COTIZADOR_DEFAULTS.recPercentSilver,
  rcGold: COTIZADOR_DEFAULTS.rcGold,
  rcSilver: COTIZADOR_DEFAULTS.rcSilver,
  consumos: COTIZADOR_DEFAULTS.consumos,
  flete: COTIZADOR_DEFAULTS.flete,
  interGold: COTIZADOR_DEFAULTS.interGold,
  interSilver: COTIZADOR_DEFAULTS.interSilver,
};

function appSettingsToDefaults(s: AppSettings): SettingsDefaults {
  return {
    factor: s.factor,
    recPercentGold: s.defaultRecPercentGold ?? FALLBACK.recPercentGold,
    recPercentSilver: s.defaultRecPercentSilver ?? FALLBACK.recPercentSilver,
    rcGold: s.defaultRcGold ?? FALLBACK.rcGold,
    rcSilver: s.defaultRcSilver ?? FALLBACK.rcSilver,
    consumos: s.defaultConsumos ?? FALLBACK.consumos,
    flete: s.defaultFlete ?? FALLBACK.flete,
    interGold: s.defaultInterGold ?? FALLBACK.interGold,
    interSilver: s.defaultInterSilver ?? FALLBACK.interSilver,
  };
}

function defaultsToAppSettings(d: SettingsDefaults): AppSettings {
  return {
    id: 'default',
    factor: d.factor,
    defaultConsumos: d.consumos,
    defaultFlete: d.flete,
    defaultRcGold: d.rcGold,
    defaultRcSilver: d.rcSilver,
    defaultRecPercentGold: d.recPercentGold,
    defaultRecPercentSilver: d.recPercentSilver,
    defaultInterGold: d.interGold,
    defaultInterSilver: d.interSilver,
    updatedAt: new Date().toISOString(),
  };
}

interface SettingsState extends SettingsDefaults {
  isHydrated: boolean;
  hydrateFromDb: () => Promise<void>;
  setDefaults: (partial: Partial<SettingsDefaults>) => Promise<void>;
  reset: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...FALLBACK,
  isHydrated: false,

  hydrateFromDb: async () => {
    const row = await configRepository.getAppSettings();
    if (row) {
      set({ ...appSettingsToDefaults(row), isHydrated: true });
    } else {
      set({ ...FALLBACK, isHydrated: true });
    }
  },

  setDefaults: async (partial) => {
    const next = { ...get(), ...partial };
    const {
      isHydrated: _h,
      hydrateFromDb: _a,
      setDefaults: _b,
      reset: _c,
      ...defaults
    } = next;
    set(defaults);
    await configRepository.saveAppSettings(defaultsToAppSettings(defaults as SettingsDefaults));
  },

  reset: async () => {
    set(FALLBACK);
    await configRepository.saveAppSettings(defaultsToAppSettings(FALLBACK));
  },
}));
