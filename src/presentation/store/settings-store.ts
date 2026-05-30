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

export interface InterSyncMetadata {
  interGoldSource: string | null;
  interSilverSource: string | null;
  interGoldFetchedAt: string | null;
  interSilverFetchedAt: string | null;
  interFetchStatus: string | null;
  interFetchError: string | null;
}

const EMPTY_INTER_META: InterSyncMetadata = {
  interGoldSource: null,
  interSilverSource: null,
  interGoldFetchedAt: null,
  interSilverFetchedAt: null,
  interFetchStatus: null,
  interFetchError: null,
};

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

function interMetaFromAppSettings(s: AppSettings): InterSyncMetadata {
  return {
    interGoldSource: s.interGoldSource ?? null,
    interSilverSource: s.interSilverSource ?? null,
    interGoldFetchedAt: s.interGoldFetchedAt ?? null,
    interSilverFetchedAt: s.interSilverFetchedAt ?? null,
    interFetchStatus: s.interFetchStatus ?? null,
    interFetchError: s.interFetchError ?? null,
  };
}

function appSettingsToState(s: AppSettings): SettingsDefaults & InterSyncMetadata {
  return {
    ...appSettingsToDefaults(s),
    ...interMetaFromAppSettings(s),
  };
}

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

function buildReferenceAppSettings(): AppSettings {
  return {
    id: 'default',
    factor: FALLBACK.factor,
    defaultConsumos: FALLBACK.consumos,
    defaultFlete: FALLBACK.flete,
    defaultRcGold: FALLBACK.rcGold,
    defaultRcSilver: FALLBACK.rcSilver,
    defaultRecPercentGold: FALLBACK.recPercentGold,
    defaultRecPercentSilver: FALLBACK.recPercentSilver,
    defaultInterGold: FALLBACK.interGold,
    defaultInterSilver: FALLBACK.interSilver,
    ...EMPTY_INTER_META,
    updatedAt: new Date().toISOString(),
  };
}

function buildAppSettings(
  defaults: SettingsDefaults,
  interMeta: InterSyncMetadata,
  previous?: AppSettings | null
): AppSettings {
  const nextMeta = { ...interMeta };

  if (previous) {
    if (defaults.interGold !== (previous.defaultInterGold ?? FALLBACK.interGold)) {
      nextMeta.interGoldSource = 'manual';
      nextMeta.interGoldFetchedAt = null;
    }
    if (defaults.interSilver !== (previous.defaultInterSilver ?? FALLBACK.interSilver)) {
      nextMeta.interSilverSource = 'manual';
      nextMeta.interSilverFetchedAt = null;
    }
  }

  return {
    id: 'default',
    factor: defaults.factor,
    defaultConsumos: defaults.consumos,
    defaultFlete: defaults.flete,
    defaultRcGold: defaults.rcGold,
    defaultRcSilver: defaults.rcSilver,
    defaultRecPercentGold: defaults.recPercentGold,
    defaultRecPercentSilver: defaults.recPercentSilver,
    defaultInterGold: defaults.interGold,
    defaultInterSilver: defaults.interSilver,
    interGoldSource: nextMeta.interGoldSource,
    interSilverSource: nextMeta.interSilverSource,
    interGoldFetchedAt: nextMeta.interGoldFetchedAt,
    interSilverFetchedAt: nextMeta.interSilverFetchedAt,
    interFetchStatus: nextMeta.interFetchStatus,
    interFetchError: nextMeta.interFetchError,
    updatedAt: new Date().toISOString(),
  };
}

interface SettingsState extends SettingsDefaults, InterSyncMetadata {
  isHydrated: boolean;
  hydrateFromDb: () => Promise<void>;
  setDefaults: (partial: Partial<SettingsDefaults>) => Promise<void>;
  reset: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...FALLBACK,
  ...EMPTY_INTER_META,
  isHydrated: false,

  hydrateFromDb: async () => {
    const row = await configRepository.getAppSettings();
    if (row) {
      set({ ...appSettingsToState(row), isHydrated: true });
    } else {
      set({ ...FALLBACK, ...EMPTY_INTER_META, isHydrated: true });
    }
  },

  setDefaults: async (partial) => {
    const current = get();
    const previous = await configRepository.getAppSettings();
    const {
      isHydrated: _h,
      hydrateFromDb: _a,
      setDefaults: _b,
      reset: _c,
      interGoldSource,
      interSilverSource,
      interGoldFetchedAt,
      interSilverFetchedAt,
      interFetchStatus,
      interFetchError,
      ...defaultsBefore
    } = current;

    const nextDefaults = { ...defaultsBefore, ...partial };
    const interMeta: InterSyncMetadata = {
      interGoldSource,
      interSilverSource,
      interGoldFetchedAt,
      interSilverFetchedAt,
      interFetchStatus,
      interFetchError,
    };

    const payload = buildAppSettings(nextDefaults, interMeta, previous);
    set({ ...nextDefaults, ...interMetaFromAppSettings(payload) });
    await configRepository.saveAppSettings(payload);
  },

  reset: async () => {
    const payload = buildReferenceAppSettings();
    set({ ...FALLBACK, ...EMPTY_INTER_META });
    await configRepository.saveAppSettings(payload);
  },
}));
