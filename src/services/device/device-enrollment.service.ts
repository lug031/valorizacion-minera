import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as Crypto from 'expo-crypto';
import { deviceRepository, userRepository } from '../../data/repositories';
import {
  setCloudDeviceId,
  setEnrollmentMode,
  setLastDeviceSyncAt,
} from '../../infrastructure/device/enrollment-store';
import { runEnrollmentGraphql } from '../../infrastructure/amplify/mobile-enrollment-client';
import type { UserRole } from '../../domain/models/enums';
import {
  EnrollmentError,
  enrollmentErrorMessage,
  parseEnrollmentError,
} from './enrollment-errors';
import {
  FINGERPRINT_VERSION,
  getDeviceFingerprintHash,
} from './device-fingerprint.service';
import { readPublicEnv } from '../../config/runtime-env';

export interface EnrollFieldDeviceInput {
  enrollmentCode: string;
  username: string;
  password: string;
  deviceLabel?: string;
}

export interface EnrollFieldDeviceResult {
  cloudDeviceId: string;
  cloudUserId: string;
  username: string;
  role: UserRole;
}

type EnrollMutationRow = {
  enrollFieldDevice?: {
    device?: {
      id?: string;
      fieldUserId?: string;
      validUntil?: string | null;
      isBlocked?: boolean | null;
      platform?: string | null;
      appVersion?: string | null;
      deviceLabel?: string | null;
    } | null;
    fieldUser?: {
      id?: string;
      username?: string;
      displayName?: string;
      role?: UserRole;
      isActive?: boolean | null;
      mobilePasswordHash?: string;
    } | null;
    serverTime?: string;
  } | null;
};

const ENROLL_FIELD_DEVICE = /* GraphQL */ `
  mutation EnrollFieldDevice(
    $enrollmentCode: String!
    $username: String!
    $password: String!
    $deviceFingerprintHash: String!
    $fingerprintVersion: String!
    $platform: String!
    $appVersion: String!
    $deviceLabel: String
  ) {
    enrollFieldDevice(
      enrollmentCode: $enrollmentCode
      username: $username
      password: $password
      deviceFingerprintHash: $deviceFingerprintHash
      fingerprintVersion: $fingerprintVersion
      platform: $platform
      appVersion: $appVersion
      deviceLabel: $deviceLabel
    ) {
      device {
        id
        fieldUserId
        validUntil
        isBlocked
        platform
        appVersion
        deviceLabel
      }
      fieldUser {
        id
        username
        displayName
        role
        isActive
        mobilePasswordHash
      }
      serverTime
    }
  }
`;

function resolveAppVersion(): string {
  return Constants.expoConfig?.version ?? '0.1.0';
}

export async function enrollFieldDeviceOnCloud(
  input: EnrollFieldDeviceInput
): Promise<EnrollFieldDeviceResult> {
  try {
    const deviceFingerprintHash = await getDeviceFingerprintHash();
    const endpoint = readPublicEnv(
      'EXPO_PUBLIC_AWS_APPSYNC_ENDPOINT',
      'EXPO_PUBLIC_APPSYNC_ENDPOINT'
    );
    const apiKey = readPublicEnv(
      'EXPO_PUBLIC_AWS_APPSYNC_API_KEY',
      'EXPO_PUBLIC_APPSYNC_API_KEY'
    );
    const authMode = 'apiKey';
    const variablesForLog = {
      enrollmentCode: input.enrollmentCode.trim(),
      username: input.username.trim().toLowerCase(),
      password: '***REDACTED***',
      deviceFingerprintHash,
      fingerprintVersion: FINGERPRINT_VERSION,
      platform: Platform.OS,
      appVersion: resolveAppVersion(),
      deviceLabel: input.deviceLabel?.trim() || undefined,
    };

    console.log(
      '[device-enrollment.service] before_enroll_mutation',
      JSON.stringify({
        endpoint,
        authMode,
        apiKeyPrefix: apiKey ? `${apiKey.slice(0, 6)}...` : 'missing',
        variables: variablesForLog,
      })
    );

    const data = await runEnrollmentGraphql<EnrollMutationRow>(ENROLL_FIELD_DEVICE, {
      enrollmentCode: input.enrollmentCode.trim(),
      username: input.username.trim().toLowerCase(),
      password: input.password,
      deviceFingerprintHash,
      fingerprintVersion: FINGERPRINT_VERSION,
      platform: Platform.OS,
      appVersion: resolveAppVersion(),
      deviceLabel: input.deviceLabel?.trim() || undefined,
    });
    console.log(
      '[device-enrollment.service] enroll_mutation_data',
      JSON.stringify({
        endpoint,
        authMode,
        data,
      })
    );

    const payload = data.enrollFieldDevice;
    const device = payload?.device;
    const fieldUser = payload?.fieldUser;
    const serverTime = payload?.serverTime ?? new Date().toISOString();

    if (
      !device?.id ||
      !fieldUser?.id ||
      !fieldUser.username ||
      !fieldUser.displayName ||
      !fieldUser.role ||
      !fieldUser.mobilePasswordHash
    ) {
      throw new EnrollmentError('UNKNOWN', 'Respuesta incompleta al activar el dispositivo.');
    }

    const localUser = await userRepository.applyEnrolledFieldUser({
      cloudUserId: fieldUser.id,
      username: fieldUser.username,
      displayName: fieldUser.displayName,
      role: fieldUser.role,
      passwordHash: fieldUser.mobilePasswordHash,
      provisionedAt: serverTime,
    });

    await userRepository.finalizeEnrollmentCleanup(fieldUser.id, fieldUser.role);

    await deviceRepository.saveEnrolledDevice({
      id: Crypto.randomUUID(),
      userId: localUser.id,
      deviceFingerprint: deviceFingerprintHash,
      cloudDeviceId: device.id,
      validUntil: device.validUntil ?? null,
      isBlocked: device.isBlocked ?? false,
      registeredAt: serverTime,
      platform: device.platform ?? Platform.OS,
      appVersion: device.appVersion ?? resolveAppVersion(),
      metadataJson: JSON.stringify({
        fingerprintVersion: FINGERPRINT_VERSION,
        deviceLabel: device.deviceLabel ?? input.deviceLabel ?? null,
      }),
    });

    await setCloudDeviceId(device.id);
    await setEnrollmentMode('enrolled');
    await setLastDeviceSyncAt(serverTime);

    console.log(
      '[device-enrollment.service] enroll_success',
      JSON.stringify({
        cloudDeviceId: device.id,
        cloudUserId: fieldUser.id,
        username: fieldUser.username,
        role: fieldUser.role,
      })
    );

    return {
      cloudDeviceId: device.id,
      cloudUserId: fieldUser.id,
      username: fieldUser.username,
      role: fieldUser.role,
    };
  } catch (error) {
    console.error(
      '[device-enrollment.service] enroll_error',
      JSON.stringify({
        errorName: error instanceof Error ? error.name : 'UnknownError',
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      })
    );
    if (error instanceof EnrollmentError) throw error;
    const parsed = parseEnrollmentError(error);
    console.error(
      '[device-enrollment.service] enroll_error_parsed',
      JSON.stringify({
        parsedCode: parsed.code,
      })
    );
    throw new EnrollmentError(parsed.code, enrollmentErrorMessage(parsed.code));
  }
}

export { enrollmentErrorMessage, parseEnrollmentError, EnrollmentError };
