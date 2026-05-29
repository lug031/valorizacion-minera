import type { AppSettings, MaquilaRange, MaterialType, Provider, ProviderDefaults } from '../../domain/models/config';

export interface ConfigRepository {
  getMaterialTypes(activeOnly?: boolean): Promise<MaterialType[]>;
  getMaquilaRanges(activeOnly?: boolean): Promise<MaquilaRange[]>;
  saveMaquilaRanges(ranges: MaquilaRange[]): Promise<void>;
  getProviders(activeOnly?: boolean): Promise<Provider[]>;
  getProviderDefaults(providerId: string): Promise<ProviderDefaults | null>;
  getAppSettings(): Promise<AppSettings | null>;
  saveAppSettings(settings: AppSettings): Promise<void>;
}
