import {
  hasUnreadCommercialUpdates,
  unreadCommercialUpdatesCount,
} from '../../src/presentation/utils/commercial-updates-unread';
import type { SyncMetadata } from '../../src/services/sync/sync-config.types';

const meta: SyncMetadata = {
  key: 'config',
  lastSyncAt: '2026-05-31T12:00:00.000Z',
  status: 'success',
  errorMessage: null,
  bundleVersion: null,
  validationIssues: [],
  recordsMaterialTypes: 0,
  recordsMaquilaRanges: 0,
  recordsProviders: 0,
  recordsProviderDefaults: 0,
  recordsAppSettings: 0,
  maxUpdatedAtMaterialTypes: null,
  maxUpdatedAtMaquilaRanges: null,
  maxUpdatedAtProviders: null,
  maxUpdatedAtProviderDefaults: null,
  maxUpdatedAtAppSettings: null,
  rawChecksum: null,
  configChangelog: {
    syncAt: '2026-05-31T12:05:00.000Z',
    entries: [{ id: 'x', category: 'valores_iniciales', label: 'INTER', previousValue: '1', newValue: '2', previousRecordedAt: null, newRecordedAt: null, syncAt: '2026-05-31T12:05:00.000Z' }],
  },
};

describe('commercial-updates-unread', () => {
  it('marca no leído si hay changelog posterior a lastSeen', () => {
    expect(hasUnreadCommercialUpdates(meta, '2026-05-31T10:00:00.000Z')).toBe(true);
    expect(unreadCommercialUpdatesCount(meta, '2026-05-31T10:00:00.000Z')).toBe(1);
  });

  it('marca leído si lastSeen >= changelog.syncAt', () => {
    expect(hasUnreadCommercialUpdates(meta, '2026-05-31T12:05:00.000Z')).toBe(false);
  });
});
