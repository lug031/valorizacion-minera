import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { DeviceRegistration } from '../../domain/models/user';
import { deviceRepository, userRepository } from '../../data/repositories';
import {
  getCloudDeviceId,
  getLastDeviceSyncAt,
  setLastDeviceSyncAt,
} from '../../infrastructure/device/enrollment-store';
import { runEnrollmentGraphql } from '../../infrastructure/amplify/mobile-enrollment-client';
import { getDeviceFingerprintHash } from './device-fingerprint.service';
import { parseEnrollmentError } from './enrollment-errors';

type SyncStatusRow = {
  syncFieldDeviceStatus?: {
    cloudDeviceId?: string;
    status?: 'pending' | 'enrolled' | 'revoked';
    isBlocked?: boolean | null;
    validUntil?: string | null;
    graceDaysOffline?: number | null;
    revokedAt?: string | null;
    fieldUserIsActive?: boolean | null;
    lastSeenAt?: string | null;
    serverTime?: string;
  } | null;
};

const SYNC_FIELD_DEVICE_STATUS = /* GraphQL */ `
  mutation SyncFieldDeviceStatus(
    $cloudDeviceId: ID!
    $deviceFingerprintHash: String!
    $platform: String
    $appVersion: String
  ) {
    syncFieldDeviceStatus(
      cloudDeviceId: $cloudDeviceId
      deviceFingerprintHash: $deviceFingerprintHash
      platform: $platform
      appVersion: $appVersion
    ) {
      cloudDeviceId
      status
      isBlocked
      validUntil
      graceDaysOffline
      revokedAt
      fieldUserIsActive
      lastSeenAt
      serverTime
    }
  }
`;

function resolveAppVersion(): string {
  return Constants.expoConfig?.version ?? '0.1.0';
}

export async function syncFieldDeviceStatusIfEnrolled(): Promise<boolean> {
  const cloudDeviceId = await getCloudDeviceId();
  if (!cloudDeviceId) return false;

  const localDevice = await deviceRepository.getEnrolledDevice();
  if (!localDevice) return false;

  try {
    const deviceFingerprintHash = await getDeviceFingerprintHash();
    const data = await runEnrollmentGraphql<SyncStatusRow>(SYNC_FIELD_DEVICE_STATUS, {
      cloudDeviceId,
      deviceFingerprintHash,
      platform: Platform.OS,
      appVersion: resolveAppVersion(),
    });

    const payload = data.syncFieldDeviceStatus;
    if (!payload?.serverTime) return false;

    const enrollmentStatus: DeviceRegistration['enrollmentStatus'] =
      payload.status === 'revoked' ? 'revoked' : 'enrolled';

    await deviceRepository.updateCachedStatus({
      cloudDeviceId,
      enrollmentStatus,
      isBlocked: payload.isBlocked ?? false,
      validUntil: payload.validUntil ?? null,
      lastSyncAt: payload.serverTime,
      platform: Platform.OS,
      appVersion: resolveAppVersion(),
    });

    if (payload.fieldUserIsActive === false) {
      const user = await userRepository.findById(localDevice.userId);
      if (user?.cloudUserId) {
        await userRepository.setActiveByCloudUserId(user.cloudUserId, false);
      }
    }

    await setLastDeviceSyncAt(payload.serverTime);
    return true;
  } catch {
    return false;
  }
}

export async function getLastDeviceSyncAtCached(): Promise<string | null> {
  return getLastDeviceSyncAt();
}

export function parseDeviceSyncError(err: unknown): string {
  return parseEnrollmentError(err).message;
}
