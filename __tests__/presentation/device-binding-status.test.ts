import { buildDeviceAuthorizationBanner } from '../../src/presentation/utils/device-binding-status';
import type { DeviceRegistration } from '../../src/domain/models/user';

function makeDevice(overrides: Partial<DeviceRegistration> = {}): DeviceRegistration {
  return {
    id: 'dev-1',
    userId: 'u-1',
    deviceFingerprint: 'fp',
    cloudDeviceId: 'cloud-1',
    validUntil: null,
    isBlocked: false,
    registeredAt: '2026-06-01T15:00:00.000Z',
    lastSyncAt: '2026-06-01T15:00:00.000Z',
    platform: 'android',
    appVersion: '1.0',
    enrollmentStatus: 'enrolled',
    graceDaysOffline: 1,
    usagePolicy: 'standard',
    trialLimitMinutes: null,
    usageQuotaResetAt: null,
    usageQuotaResetAppliedAt: null,
    usageAccumulatedMs: 0,
    notes: null,
    metadataJson: null,
    ...overrides,
  };
}

describe('buildDeviceAuthorizationBanner', () => {
  it('muestra solo validez administrativa cuando aplica', () => {
    const model = buildDeviceAuthorizationBanner(
      makeDevice({ validUntil: '2026-12-31T23:59:59.999Z' }),
      new Date('2026-06-01T16:00:00.000Z')
    );
    expect(model?.lines).toHaveLength(1);
    expect(model?.lines[0]).toContain('administrador');
    expect(model?.lines.some((l) => l.includes('confirmación'))).toBe(false);
  });

  it('no muestra banner sin validUntil', () => {
    expect(buildDeviceAuthorizationBanner(makeDevice({ validUntil: null }))).toBeNull();
  });

  it('oculta si no está enrolled', () => {
    expect(buildDeviceAuthorizationBanner(makeDevice({ enrollmentStatus: 'pending' }))).toBeNull();
  });
});
