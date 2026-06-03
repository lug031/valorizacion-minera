import NetInfo from '@react-native-community/netinfo';
import { hashPassword } from '../../src/data/security/password-hash';
import { loginLocal } from '../../src/presentation/services/auth/auth-service';

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(),
}));

jest.mock('../../src/data/repositories', () => ({
  userRepository: {
    verifyCredentials: jest.fn(),
    findByUsername: jest.fn(),
    findById: jest.fn(),
    updatePasswordHash: jest.fn(),
  },
}));

jest.mock('../../src/infrastructure/device/enrollment-store', () => ({
  getEnrollmentMode: jest.fn(),
  getCloudDeviceId: jest.fn(),
  setEnrollmentMode: jest.fn(),
}));

jest.mock('../../src/services/device/device-fingerprint.service', () => ({
  getDeviceFingerprintHash: jest.fn(async () => 'fp-hash'),
}));

jest.mock('../../src/services/device/device-session-token.service', () => ({
  tryIssueAndStoreDeviceSessionToken: jest.fn(),
}));

jest.mock('../../src/presentation/services/auth/session-storage', () => ({
  saveSessionToken: jest.fn(),
  getSessionToken: jest.fn(),
  clearSessionToken: jest.fn(),
}));

jest.mock('../../src/config/device-enrollment-required', () => ({
  isDeviceEnrollmentRequired: jest.fn(() => true),
}));

jest.mock('../../src/data/db/database', () => ({
  getSqlExecutor: jest.fn(),
}));

const { userRepository } = require('../../src/data/repositories') as {
  userRepository: {
    verifyCredentials: jest.Mock;
    findByUsername: jest.Mock;
    findById: jest.Mock;
    updatePasswordHash: jest.Mock;
  };
};

const { getEnrollmentMode, getCloudDeviceId } = require('../../src/infrastructure/device/enrollment-store') as {
  getEnrollmentMode: jest.Mock;
  getCloudDeviceId: jest.Mock;
};

const { tryIssueAndStoreDeviceSessionToken } = require('../../src/services/device/device-session-token.service') as {
  tryIssueAndStoreDeviceSessionToken: jest.Mock;
};

const baseUser = {
  id: 'f-cloud-lugo',
  username: 'lugo',
  passwordHash: 'vm-sha256:old',
  role: 'operador' as const,
  isActive: true,
  displayName: 'Lugo',
  cloudUserId: 'cloud-lugo',
  authSource: 'local_provisioned' as const,
  provisionedAt: '2026-06-01T00:00:00.000Z',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-01T00:00:00.000Z',
};

describe('loginLocal password sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getEnrollmentMode.mockResolvedValue('enrolled');
    getCloudDeviceId.mockResolvedValue('cloud-device-1');
    (NetInfo.fetch as jest.Mock).mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
    });
    tryIssueAndStoreDeviceSessionToken.mockResolvedValue('session-token');
  });

  it('acepta clave nueva de la web cuando el hash local está desactualizado', async () => {
    userRepository.verifyCredentials.mockResolvedValue(null);
    userRepository.findByUsername.mockResolvedValue(baseUser);
    const newHash = await hashPassword('NuevaClave9!');
    userRepository.findById.mockResolvedValue({ ...baseUser, passwordHash: newHash });

    const actor = await loginLocal('lugo', 'NuevaClave9!');

    expect(actor?.username).toBe('lugo');
    expect(tryIssueAndStoreDeviceSessionToken).toHaveBeenCalled();
    expect(userRepository.updatePasswordHash).toHaveBeenCalledWith(baseUser.id, newHash);
  });

  it('rechaza clave antigua si la web ya restableció la contraseña (con internet)', async () => {
    userRepository.verifyCredentials.mockResolvedValue(baseUser);
    tryIssueAndStoreDeviceSessionToken.mockResolvedValue(null);

    const actor = await loginLocal('lugo', 'ClaveVieja9!');

    expect(actor).toBeNull();
  });
});
