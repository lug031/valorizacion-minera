import { isConfigBundleUnchanged, configPayloadChecksum } from '../../src/services/sync/sync-config-checksum';
import type { SyncMetadata } from '../../src/services/sync/sync-config.types';
import type { SyncCloudPayload } from '../../src/services/sync/sync-config.schemas';

const baseMeta: SyncMetadata = {
  key: 'config',
  lastSyncAt: '2026-05-31T10:00:00.000Z',
  status: 'success',
  errorMessage: null,
  bundleVersion: 'v1',
  validationIssues: [],
  recordsMaterialTypes: 0,
  recordsMaquilaRanges: 0,
  recordsProviders: 0,
  recordsProviderDefaults: 0,
  recordsAppSettings: 1,
  maxUpdatedAtMaterialTypes: null,
  maxUpdatedAtMaquilaRanges: null,
  maxUpdatedAtProviders: null,
  maxUpdatedAtProviderDefaults: null,
  maxUpdatedAtAppSettings: null,
  rawChecksum: null,
  configChangelog: null,
};

const payload: SyncCloudPayload = {
  materialTypes: [],
  maquilaRanges: [],
  providers: [],
  providerDefaults: [],
  appSettings: [
    {
      id: '1',
      settingsKey: 'default',
      factor: '1',
    },
  ],
};

describe('sync-config-checksum', () => {
  it('detecta bundle idéntico', () => {
    const checksum = configPayloadChecksum(payload);
    expect(
      isConfigBundleUnchanged({ ...baseMeta, rawChecksum: checksum }, payload)
    ).toBe(true);
  });

  it('no omite si nunca hubo sync exitosa', () => {
    expect(
      isConfigBundleUnchanged(
        { ...baseMeta, lastSyncAt: null, rawChecksum: configPayloadChecksum(payload) },
        payload
      )
    ).toBe(false);
  });
});
