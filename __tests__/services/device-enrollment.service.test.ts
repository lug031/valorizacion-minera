jest.mock('../../src/data/repositories', () => ({
  userRepository: {
    applyEnrolledFieldUser: jest.fn(),
    finalizeEnrollmentCleanup: jest.fn(),
  },
  deviceRepository: {
    saveEnrolledDevice: jest.fn(),
  },
}));

jest.mock('../../src/infrastructure/device/enrollment-store', () => ({
  setCloudDeviceId: jest.fn(),
  setEnrollmentMode: jest.fn(),
  setLastDeviceSyncAt: jest.fn(),
}));

jest.mock('../../src/infrastructure/amplify/mobile-enrollment-client', () => ({
  runEnrollmentGraphql: jest.fn(),
}));

jest.mock('../../src/services/device/device-fingerprint.service', () => ({
  FINGERPRINT_VERSION: 'v1',
  getDeviceFingerprintHash: jest.fn(),
}));

jest.mock('../../src/config/dev-log', () => ({
  logDevError: jest.fn(),
}));

jest.mock('../../src/services/device/device-session-token.service', () => ({
  tryIssueAndStoreDeviceSessionToken: jest.fn(),
}));

const { enrollFieldDeviceOnCloud } = require('../../src/services/device/device-enrollment.service') as typeof import('../../src/services/device/device-enrollment.service');
const { hashPassword } = require('../../src/data/security/password-hash') as typeof import('../../src/data/security/password-hash');
const { userRepository, deviceRepository } = require('../../src/data/repositories') as {
  userRepository: {
    applyEnrolledFieldUser: jest.Mock;
    finalizeEnrollmentCleanup: jest.Mock;
  };
  deviceRepository: {
    saveEnrolledDevice: jest.Mock;
  };
};
const { runEnrollmentGraphql } = require('../../src/infrastructure/amplify/mobile-enrollment-client') as {
  runEnrollmentGraphql: jest.Mock;
};
const { getDeviceFingerprintHash } = require('../../src/services/device/device-fingerprint.service') as {
  getDeviceFingerprintHash: jest.Mock;
};
const {
  setCloudDeviceId,
  setEnrollmentMode,
  setLastDeviceSyncAt,
} = require('../../src/infrastructure/device/enrollment-store') as {
  setCloudDeviceId: jest.Mock;
  setEnrollmentMode: jest.Mock;
  setLastDeviceSyncAt: jest.Mock;
};
const { tryIssueAndStoreDeviceSessionToken } = require('../../src/services/device/device-session-token.service') as {
  tryIssueAndStoreDeviceSessionToken: jest.Mock;
};

const enrollPayload = {
  enrollFieldDevice: {
    device: {
      id: 'cloud-device-1',
      fieldUserId: 'cloud-user-1',
      validUntil: null,
      isBlocked: false,
      platform: 'android',
      appVersion: '1.0.0',
      deviceLabel: 'Tel A',
      graceDaysOffline: 1,
      usagePolicy: 'trial' as const,
      trialLimitMinutes: 120,
      usageQuotaResetAt: '2026-06-02T07:00:00.000Z',
    },
    fieldUser: {
      id: 'cloud-user-1',
      username: 'lugo',
      displayName: 'Lugo',
      role: 'operador' as const,
      isActive: true,
    },
    serverTime: '2026-06-02T07:00:00.000Z',
  },
};

describe('enrollFieldDeviceOnCloud', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getDeviceFingerprintHash.mockResolvedValue('vm-sha256:fingerprint');
    userRepository.applyEnrolledFieldUser.mockResolvedValue({ id: 'local-user-1' });
    userRepository.finalizeEnrollmentCleanup.mockResolvedValue(undefined);
    deviceRepository.saveEnrolledDevice.mockResolvedValue(undefined);
    setCloudDeviceId.mockResolvedValue(undefined);
    setEnrollmentMode.mockResolvedValue(undefined);
    setLastDeviceSyncAt.mockResolvedValue(undefined);
    tryIssueAndStoreDeviceSessionToken.mockResolvedValue('token');
    runEnrollmentGraphql.mockResolvedValue(enrollPayload);
  });

  it('deriva hash local con la contraseña ingresada', async () => {
    const password = 'clave-segura-123';
    const expectedHash = await hashPassword(password);

    await enrollFieldDeviceOnCloud({
      enrollmentCode: 'ABCD-EFGH',
      username: 'lugo',
      password,
    });

    expect(userRepository.applyEnrolledFieldUser).toHaveBeenCalledWith(
      expect.objectContaining({
        passwordHash: expectedHash,
      })
    );
  });

  it('completa activación aunque falle el token de sesión en la nube', async () => {
    tryIssueAndStoreDeviceSessionToken.mockResolvedValue(null);

    const result = await enrollFieldDeviceOnCloud({
      enrollmentCode: 'JBKP-WQBK',
      username: 'lugo',
      password: 'clave',
    });

    expect(result.cloudDeviceId).toBe('cloud-device-1');
    expect(setEnrollmentMode).toHaveBeenCalledWith('enrolled');
  });
});
