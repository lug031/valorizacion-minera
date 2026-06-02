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
  issueAndStoreDeviceSessionToken: jest.fn(),
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
const { logDevError } = require('../../src/config/dev-log') as {
  logDevError: jest.Mock;
};
const { issueAndStoreDeviceSessionToken } = require('../../src/services/device/device-session-token.service') as {
  issueAndStoreDeviceSessionToken: jest.Mock;
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
    issueAndStoreDeviceSessionToken.mockResolvedValue('token');
  });

  it('usa mobilePasswordHash cuando viene en respuesta (compatibilidad actual)', async () => {
    runEnrollmentGraphql.mockResolvedValue({
      enrollFieldDevice: {
        device: {
          id: 'cloud-device-1',
          validUntil: null,
          isBlocked: false,
          platform: 'android',
          appVersion: '1.0.0',
          deviceLabel: 'Tel A',
          graceDaysOffline: 7,
        },
        fieldUser: {
          id: 'cloud-user-1',
          username: 'operador.a',
          displayName: 'Operador A',
          role: 'operador',
          isActive: true,
          mobilePasswordHash: 'vm-sha256:server-hash',
        },
        serverTime: '2026-06-02T07:00:00.000Z',
      },
    });

    await enrollFieldDeviceOnCloud({
      enrollmentCode: 'ABCD-EFGH',
      username: 'operador.a',
      password: 'secret123',
    });

    expect(userRepository.applyEnrolledFieldUser).toHaveBeenCalledWith(
      expect.objectContaining({
        passwordHash: 'vm-sha256:server-hash',
      })
    );
  });

  it('deriva hash local cuando mobilePasswordHash no viene en respuesta', async () => {
    runEnrollmentGraphql.mockResolvedValue({
      enrollFieldDevice: {
        device: {
          id: 'cloud-device-2',
          validUntil: null,
          isBlocked: false,
          platform: 'android',
          appVersion: '1.0.0',
          deviceLabel: 'Tel B',
          graceDaysOffline: 7,
        },
        fieldUser: {
          id: 'cloud-user-2',
          username: 'operador.b',
          displayName: 'Operador B',
          role: 'operador',
          isActive: true,
        },
        serverTime: '2026-06-02T07:10:00.000Z',
      },
    });

    const password = 'clave-segura-123';
    const expectedHash = await hashPassword(password);

    await enrollFieldDeviceOnCloud({
      enrollmentCode: 'IJKL-MNOP',
      username: 'operador.b',
      password,
    });

    expect(userRepository.applyEnrolledFieldUser).toHaveBeenCalledWith(
      expect.objectContaining({
        passwordHash: expectedHash,
      })
    );
  });

  it('registra advertencia sin romper flujo cuando hash de respuesta difiere del derivado local', async () => {
    runEnrollmentGraphql.mockResolvedValue({
      enrollFieldDevice: {
        device: {
          id: 'cloud-device-3',
          validUntil: null,
          isBlocked: false,
          platform: 'android',
          appVersion: '1.0.0',
          deviceLabel: 'Tel C',
          graceDaysOffline: 7,
        },
        fieldUser: {
          id: 'cloud-user-3',
          username: 'operador.c',
          displayName: 'Operador C',
          role: 'operador',
          isActive: true,
          mobilePasswordHash: 'vm-sha256:distinto',
        },
        serverTime: '2026-06-02T07:20:00.000Z',
      },
    });

    await enrollFieldDeviceOnCloud({
      enrollmentCode: 'QRST-UVWX',
      username: 'operador.c',
      password: 'otra-clave',
    });

    expect(logDevError).toHaveBeenCalledWith(
      '[device-enrollment.service] enrollment_hash_mismatch',
      expect.any(String)
    );
    expect(userRepository.applyEnrolledFieldUser).toHaveBeenCalledWith(
      expect.objectContaining({
        passwordHash: 'vm-sha256:distinto',
      })
    );
  });
});
