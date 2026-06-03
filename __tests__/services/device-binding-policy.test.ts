import { evaluateBindingPolicy } from '../../src/domain/device/device-binding-policy';
import type { DeviceRegistration } from '../../src/domain/models/user';

function makeDevice(overrides: Partial<DeviceRegistration> = {}): DeviceRegistration {
  return {
    id: 'dev-1',
    userId: 'f-cloud-1',
    deviceFingerprint: 'vm-sha256:abc',
    cloudDeviceId: 'cloud-dev-1',
    validUntil: null,
    isBlocked: false,
    registeredAt: '2026-05-27T10:00:00.000Z',
    lastSyncAt: '2026-05-27T10:00:00.000Z',
    platform: 'android',
    appVersion: '0.1.0',
    enrollmentStatus: 'enrolled',
    graceDaysOffline: null,
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

describe('evaluateBindingPolicy', () => {
  const now = new Date('2026-05-28T10:00:00.000Z');

  it('bloquea dispositivo revocado', () => {
    const result = evaluateBindingPolicy(
      makeDevice({ enrollmentStatus: 'revoked' }),
      '2026-05-27T10:00:00.000Z',
      now
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('revoked');
  });

  it('bloquea dispositivo suspendido', () => {
    const result = evaluateBindingPolicy(
      makeDevice({ isBlocked: true }),
      '2026-05-27T10:00:00.000Z',
      now
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('blocked');
  });

  it('permite dentro del grace offline (1 día)', () => {
    const result = evaluateBindingPolicy(makeDevice(), '2026-05-27T10:00:00.000Z', now);
    expect(result.ok).toBe(true);
  });

  it('bloquea por validUntil vencido sin esperar gracia', () => {
    const result = evaluateBindingPolicy(
      makeDevice({ validUntil: '2026-05-27T12:00:00.000Z' }),
      '2026-05-27T10:00:00.000Z',
      now
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('expired');
  });

  it('bloquea stale_sync tras 1 día sin confirmación', () => {
    const result = evaluateBindingPolicy(
      makeDevice(),
      '2026-05-26T09:00:00.000Z',
      now
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('stale_sync');
  });
});
