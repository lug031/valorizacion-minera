import { configRepository } from '../../data/repositories';

export interface ConfigAppSettingsSnapshot {
  factor: string;
  defaultConsumos: string | null;
  defaultFlete: string | null;
  defaultRcGold: string | null;
  defaultRcSilver: string | null;
  defaultRecPercentGold: string | null;
  defaultRecPercentSilver: string | null;
  defaultInterGold: string | null;
  defaultInterSilver: string | null;
  updatedAt: string | null;
}

export interface ConfigMaterialTypeSnapshot {
  code: string;
  label: string;
  isActive: boolean;
  updatedAt: string | null;
}

export interface ConfigMaquilaRangeSnapshot {
  id: string;
  minLeyOzTc: string;
  maxLeyOzTc: string;
  maquila: string;
  isActive: boolean;
  updatedAt: string | null;
}

export interface ConfigSyncSnapshot {
  appSettings: ConfigAppSettingsSnapshot | null;
  materialTypes: ConfigMaterialTypeSnapshot[];
  maquilaRanges: ConfigMaquilaRangeSnapshot[];
}

export async function captureConfigSnapshot(): Promise<ConfigSyncSnapshot> {
  const [appSettings, materialTypes, maquilaRanges] = await Promise.all([
    configRepository.getAppSettings(),
    configRepository.getMaterialTypes(false),
    configRepository.getMaquilaRanges(false),
  ]);

  return {
    appSettings: appSettings
      ? {
          factor: appSettings.factor,
          defaultConsumos: appSettings.defaultConsumos,
          defaultFlete: appSettings.defaultFlete,
          defaultRcGold: appSettings.defaultRcGold,
          defaultRcSilver: appSettings.defaultRcSilver,
          defaultRecPercentGold: appSettings.defaultRecPercentGold,
          defaultRecPercentSilver: appSettings.defaultRecPercentSilver,
          defaultInterGold: appSettings.defaultInterGold,
          defaultInterSilver: appSettings.defaultInterSilver,
          updatedAt: appSettings.updatedAt,
        }
      : null,
    materialTypes: materialTypes.map((m) => ({
      code: m.code,
      label: m.label,
      isActive: m.isActive,
      updatedAt: m.updatedAt ?? null,
    })),
    maquilaRanges: maquilaRanges.map((r) => ({
      id: r.id,
      minLeyOzTc: r.minLeyOzTc,
      maxLeyOzTc: r.maxLeyOzTc,
      maquila: r.maquila,
      isActive: r.isActive ?? true,
      updatedAt: r.updatedAt ?? null,
    })),
  };
}
