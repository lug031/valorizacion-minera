import { resolveMasterConfigBanner } from '../../src/presentation/utils/master-config-sync-banner';

describe('resolveMasterConfigBanner', () => {
  it('avisa sin conexión', () => {
    const banner = resolveMasterConfigBanner({
      isConnected: false,
      metadata: null,
    });
    expect(banner?.message).toMatch(/internet/i);
  });

  it('avisa si nunca hubo sync exitosa', () => {
    const banner = resolveMasterConfigBanner({
      isConnected: true,
      metadata: {
        key: 'config',
        lastSyncAt: null,
        status: 'idle',
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
        configChangelog: null,
      },
    });
    expect(banner?.message).toMatch(/descargado/i);
  });

  it('no muestra banner de carga', () => {
    const banner = resolveMasterConfigBanner({
      isConnected: true,
      metadata: {
        key: 'config',
        lastSyncAt: '2026-01-01T00:00:00.000Z',
        status: 'success',
        errorMessage: null,
        bundleVersion: '1',
        validationIssues: [],
        recordsMaterialTypes: 1,
        recordsMaquilaRanges: 1,
        recordsProviders: 0,
        recordsProviderDefaults: 0,
        recordsAppSettings: 1,
        maxUpdatedAtMaterialTypes: null,
        maxUpdatedAtMaquilaRanges: null,
        maxUpdatedAtProviders: null,
        maxUpdatedAtProviderDefaults: null,
        maxUpdatedAtAppSettings: null,
        rawChecksum: 'x',
        configChangelog: null,
      },
    });
    expect(banner).toBeNull();
  });
});
