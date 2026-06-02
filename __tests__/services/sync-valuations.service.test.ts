import { fetch as netInfoFetch } from '@react-native-community/netinfo';
import { VALUATION_SKIP_NO_CLOUD_USER_MESSAGE } from '../../src/services/sync/sync-valuation-messages';
import type { ValuationPushRow } from '../../src/data/repositories/valuation-repository';

jest.mock('../../src/data/repositories', () => ({
  valuationRepository: {
    resetOrphanedSyncing: jest.fn(),
    listPendingForSync: jest.fn(),
    markSyncing: jest.fn(),
    markSynced: jest.fn(),
    markSyncError: jest.fn(),
  },
  deviceRepository: {
    getBindingDevice: jest.fn(),
  },
}));
jest.mock('../../src/infrastructure/device/enrollment-store', () => ({
  getEnrollmentMode: jest.fn(),
  getCloudDeviceId: jest.fn(),
}));
jest.mock('../../src/services/device/device-session-token.service', () => ({
  getValidDeviceSessionToken: jest.fn(),
}));
jest.mock('../../src/infrastructure/amplify/mobile-enrollment-client', () => ({
  runEnrollmentGraphql: jest.fn(),
}));
jest.mock('../../src/services/device/device-fingerprint.service', () => ({
  getDeviceFingerprintHash: jest.fn(),
}));
jest.mock('../../src/config/dev-log', () => ({ logDev: jest.fn() }));

const { syncPendingValuations } = require('../../src/services/sync/sync-valuations.service') as typeof import('../../src/services/sync/sync-valuations.service');
const { valuationRepository, deviceRepository } = require('../../src/data/repositories') as {
  valuationRepository: {
    resetOrphanedSyncing: jest.Mock;
    listPendingForSync: jest.Mock;
    markSyncing: jest.Mock;
    markSynced: jest.Mock;
    markSyncError: jest.Mock;
  };
  deviceRepository: { getBindingDevice: jest.Mock };
};
const { getCloudDeviceId, getEnrollmentMode } = require('../../src/infrastructure/device/enrollment-store') as {
  getCloudDeviceId: jest.Mock;
  getEnrollmentMode: jest.Mock;
};
const { runEnrollmentGraphql } = require('../../src/infrastructure/amplify/mobile-enrollment-client') as {
  runEnrollmentGraphql: jest.Mock;
};
const { getDeviceFingerprintHash } = require('../../src/services/device/device-fingerprint.service') as {
  getDeviceFingerprintHash: jest.Mock;
};
const { getValidDeviceSessionToken } = require('../../src/services/device/device-session-token.service') as {
  getValidDeviceSessionToken: jest.Mock;
};

const mockNetInfo = netInfoFetch as jest.Mock;
const mockReset = valuationRepository.resetOrphanedSyncing;
const mockList = valuationRepository.listPendingForSync;
const mockMarkSyncing = valuationRepository.markSyncing;
const mockMarkSynced = valuationRepository.markSynced;
const mockMarkSyncError = valuationRepository.markSyncError;
const mockGetDevice = deviceRepository.getBindingDevice;
const mockEnrollmentMode = getEnrollmentMode;
const mockCloudDeviceId = getCloudDeviceId;
const mockGraphql = runEnrollmentGraphql;
const mockFingerprint = getDeviceFingerprintHash;
const mockDeviceSessionToken = getValidDeviceSessionToken;

function sampleRow(overrides: Partial<ValuationPushRow> = {}): ValuationPushRow {
  return {
    id: 'val-1',
    code: 'VAL-001',
    materialTypeCode: 'MSC',
    providerName: null,
    fecha: '2026-05-01',
    observaciones: null,
    formulaVersion: 'v1',
    snapshotJson: '{}',
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    createdByUserId: 'u1',
    createdByUsername: 'op1',
    cloudUserId: 'cloud-u1',
    syncStatus: 'pending',
    cloudValuationId: null,
    ...overrides,
  };
}

describe('syncPendingValuations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNetInfo.mockResolvedValue({ isConnected: true });
    mockEnrollmentMode.mockResolvedValue('enrolled');
    mockCloudDeviceId.mockResolvedValue('device-cloud-1');
    mockGetDevice.mockResolvedValue({
      enrollmentStatus: 'enrolled',
      metadataJson: JSON.stringify({ deviceLabel: 'Tel A' }),
    });
    mockFingerprint.mockResolvedValue('fp-hash');
    mockDeviceSessionToken.mockResolvedValue('session-token');
    mockReset.mockResolvedValue(0);
    mockList.mockResolvedValue([]);
  });

  it('recupera filas syncing huérfanas antes de procesar la cola', async () => {
    mockReset.mockResolvedValue(2);
    mockList.mockResolvedValue([]);

    const result = await syncPendingValuations();

    expect(mockReset).toHaveBeenCalledTimes(1);
    expect(result.recoveredOrphans).toBe(2);
    expect(result.attempted).toBe(0);
  });

  it('sincroniza con éxito y marca synced', async () => {
    mockList.mockResolvedValue([sampleRow()]);
    mockGraphql.mockResolvedValue({
      pushMobileValuation: { cloudValuationId: 'cloud-val-1', alreadyExisted: false },
    });

    const result = await syncPendingValuations();

    expect(result.synced).toBe(1);
    expect(result.failed).toBe(0);
    expect(mockMarkSyncing).toHaveBeenCalledWith('val-1');
    expect(mockMarkSynced).toHaveBeenCalledWith('val-1', 'cloud-val-1');
    expect(mockMarkSyncError).not.toHaveBeenCalled();
  });

  it('trata alreadyExisted como éxito si hay cloudValuationId', async () => {
    mockList.mockResolvedValue([sampleRow()]);
    mockGraphql.mockResolvedValue({
      pushMobileValuation: {
        cloudValuationId: 'cloud-existing',
        alreadyExisted: true,
      },
    });

    const result = await syncPendingValuations();

    expect(result.synced).toBe(1);
    expect(mockMarkSynced).toHaveBeenCalledWith('val-1', 'cloud-existing');
  });

  it('marca error en fallo temporal y no marca synced', async () => {
    mockList.mockResolvedValue([sampleRow()]);
    mockGraphql.mockRejectedValue(new Error('[NETWORK_ERROR] Sin conexión'));

    const result = await syncPendingValuations();

    expect(result.failed).toBe(1);
    expect(result.synced).toBe(0);
    expect(mockMarkSyncError).toHaveBeenCalled();
  });

  it('marca error permanente de dispositivo revocado', async () => {
    mockList.mockResolvedValue([sampleRow()]);
    mockGraphql.mockRejectedValue(new Error('[DEVICE_REVOKED] Dispositivo revocado'));

    const result = await syncPendingValuations();

    expect(result.failed).toBe(1);
    expect(mockMarkSyncError).toHaveBeenCalledWith(
      'val-1',
      expect.stringContaining('no está autorizado')
    );
  });

  it('omite usuario sin cloud_user_id sin marcar error', async () => {
    mockList.mockResolvedValue([sampleRow({ cloudUserId: null })]);

    const result = await syncPendingValuations();

    expect(result.skipped).toBe(1);
    expect(result.synced).toBe(0);
    expect(mockMarkSyncing).not.toHaveBeenCalled();
    expect(mockMarkSyncError).not.toHaveBeenCalled();
    expect(result.errors).toHaveLength(0);
  });

  it('no intenta sync sin red', async () => {
    mockNetInfo.mockResolvedValue({ isConnected: false });

    const result = await syncPendingValuations();

    expect(result.attempted).toBe(0);
    expect(mockReset).not.toHaveBeenCalled();
  });
});

describe('skip message constant', () => {
  it('coincide con detección en servicio', () => {
    expect(VALUATION_SKIP_NO_CLOUD_USER_MESSAGE).toContain('usuario local');
  });
});
