import { z } from 'zod';

const nullableString = z.string().nullable().optional();

export const cloudMaterialTypeSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  label: z.string().min(1),
  isActive: z.boolean().nullable().optional(),
  sortOrder: z.number().int().nullable().optional(),
  notes: nullableString,
  metadataJson: nullableString,
  updatedAt: nullableString,
});

export const cloudMaquilaRangeSchema = z.object({
  id: z.string().min(1),
  minLeyOzTc: z.string().min(1),
  maxLeyOzTc: z.string().min(1),
  maquila: z.string().min(1),
  sortOrder: z.number().int().nullable().optional(),
  isActive: z.boolean().nullable().optional(),
  notes: nullableString,
  updatedAt: nullableString,
});

export const cloudProviderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  isActive: z.boolean().nullable().optional(),
  updatedAt: nullableString,
});

export const cloudProviderDefaultsSchema = z.object({
  id: z.string().min(1),
  providerId: z.string().min(1),
  recPercentGold: nullableString,
  recPercentSilver: nullableString,
  rcGold: nullableString,
  rcSilver: nullableString,
  consumos: nullableString,
  flete: nullableString,
  interGold: nullableString,
  interSilver: nullableString,
  factor: nullableString,
  updatedAt: nullableString,
});

export const cloudAppSettingsSchema = z.object({
  id: z.string().min(1),
  settingsKey: z.string().min(1),
  factor: z.string().min(1),
  defaultConsumos: nullableString,
  defaultFlete: nullableString,
  defaultRcGold: nullableString,
  defaultRcSilver: nullableString,
  defaultRecPercentGold: nullableString,
  defaultRecPercentSilver: nullableString,
  defaultInterGold: nullableString,
  defaultInterSilver: nullableString,
  interGoldSource: nullableString,
  interSilverSource: nullableString,
  interGoldFetchedAt: nullableString,
  interSilverFetchedAt: nullableString,
  interFetchStatus: nullableString,
  interFetchError: nullableString,
  updatedAt: nullableString,
});

export const syncCloudPayloadSchema = z.object({
  materialTypes: z.array(cloudMaterialTypeSchema),
  maquilaRanges: z.array(cloudMaquilaRangeSchema),
  providers: z.array(cloudProviderSchema),
  providerDefaults: z.array(cloudProviderDefaultsSchema),
  appSettings: z.array(cloudAppSettingsSchema),
});

export type SyncCloudPayload = z.infer<typeof syncCloudPayloadSchema>;
