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
import { getValidDeviceSessionToken } from './device-session-token.service';

type SyncStatusRow = {
  syncFieldDeviceStatus?: {
    cloudDeviceId?: string;
    status?: 'pending' | 'enrolled' | 'revoked';
    isBlocked?: boolean | null;
    validUntil?: string | null;
    graceDaysOffline?: number | null;
    usagePolicy?: 'standard' | 'trial' | null;
    trialLimitMinutes?: number | null;
    usageQuotaResetAt?: string | null;
    revokedAt?: string | null;
    fieldUserIsActive?: boolean | null;
    fieldUserRole?: 'admin' | 'operador' | null;
    fieldUserDisplayName?: string | null;
    lastSeenAt?: string | null;
    serverTime?: string;
  } | null;
};

const SYNC_FIELD_DEVICE_STATUS = /* GraphQL */ `
  mutation SyncFieldDeviceStatus(
    $cloudDeviceId: ID!
    $deviceFingerprintHash: String!
    $sessionToken: String!
    $platform: String
    $appVersion: String
  ) {
    syncFieldDeviceStatus(
      cloudDeviceId: $cloudDeviceId
      deviceFingerprintHash: $deviceFingerprintHash
      sessionToken: $sessionToken
      platform: $platform
      appVersion: $appVersion
    ) {
      cloudDeviceId
      status
      isBlocked
      validUntil
      graceDaysOffline
      usagePolicy
      trialLimitMinutes
      usageQuotaResetAt
      revokedAt
      fieldUserIsActive
      fieldUserRole
      fieldUserDisplayName
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

  const localDevice = await deviceRepository.getBindingDevice(cloudDeviceId);
  if (!localDevice?.cloudDeviceId) return false;

  try {
    const deviceFingerprintHash = await getDeviceFingerprintHash();
    const sessionToken = await getValidDeviceSessionToken({
      cloudDeviceId,
      deviceFingerprintHash,
    });
    const data = await runEnrollmentGraphql<SyncStatusRow>(SYNC_FIELD_DEVICE_STATUS, {
      cloudDeviceId,
      deviceFingerprintHash,
      sessionToken,
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
      graceDaysOffline: payload.graceDaysOffline ?? null,
      usagePolicy: payload.usagePolicy === 'trial' ? 'trial' : 'standard',
      trialLimitMinutes: payload.trialLimitMinutes ?? null,
      usageQuotaResetAt: payload.usageQuotaResetAt ?? null,
    });

    const user = await userRepository.findById(localDevice.userId);
    if (user?.cloudUserId) {
      const role =
        payload.fieldUserRole === 'admin' || payload.fieldUserRole === 'operador'
          ? payload.fieldUserRole
          : undefined;
      await userRepository.updateFieldUserFromCloud({
        cloudUserId: user.cloudUserId,
        role,
        displayName: payload.fieldUserDisplayName?.trim() || undefined,
        isActive:
          payload.fieldUserIsActive === true || payload.fieldUserIsActive === false
            ? payload.fieldUserIsActive
            : undefined,
      });
    }

    await setLastDeviceSyncAt(payload.serverTime);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('[DEVICE_ALREADY_REVOKED]')) {
      await deviceRepository.updateCachedStatus({
        cloudDeviceId,
        enrollmentStatus: 'revoked',
        isBlocked: true,
        validUntil: localDevice.validUntil,
        lastSyncAt: new Date().toISOString(),
        platform: Platform.OS,
        appVersion: resolveAppVersion(),
      });
      return true;
    }
    return false;
  }
}

export async function getLastDeviceSyncAtCached(): Promise<string | null> {
  return getLastDeviceSyncAt();
}

export function parseDeviceSyncError(err: unknown): string {
  return parseEnrollmentError(err).message;
}
