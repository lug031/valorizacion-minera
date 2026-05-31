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

  it('permite dentro del grace offline', () => {
    const result = evaluateBindingPolicy(makeDevice(), '2026-05-27T10:00:00.000Z', now);
    expect(result.ok).toBe(true);
  });
});
