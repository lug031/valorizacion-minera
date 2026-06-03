import { runEnrollmentGraphql } from '../../infrastructure/amplify/mobile-enrollment-client';
import { getCloudDeviceId } from '../../infrastructure/device/enrollment-store';
import { getDeviceFingerprintHash } from './device-fingerprint.service';
import { deviceRepository } from '../../data/repositories';
import { parseEnrollmentError } from './enrollment-errors';

type RedeemRow = {
  redeemUsageExtensionCode?: {
    cloudDeviceId?: string;
    usageQuotaResetAt?: string;
    grantMinutes?: number;
    serverTime?: string;
  } | null;
};

const REDEEM_USAGE_EXTENSION_CODE = /* GraphQL */ `
  mutation RedeemUsageExtensionCode(
    $extensionCode: String!
    $cloudDeviceId: ID!
    $deviceFingerprintHash: String!
  ) {
    redeemUsageExtensionCode(
      extensionCode: $extensionCode
      cloudDeviceId: $cloudDeviceId
      deviceFingerprintHash: $deviceFingerprintHash
    ) {
      cloudDeviceId
      usageQuotaResetAt
      grantMinutes
      serverTime
    }
  }
`;

export async function redeemUsageExtensionCode(extensionCode: string): Promise<void> {
  const cloudDeviceId = await getCloudDeviceId();
  if (!cloudDeviceId) {
    throw new Error('Dispositivo no activado.');
  }

  const deviceFingerprintHash = await getDeviceFingerprintHash();
  const data = await runEnrollmentGraphql<RedeemRow>(REDEEM_USAGE_EXTENSION_CODE, {
    extensionCode: extensionCode.trim(),
    cloudDeviceId,
    deviceFingerprintHash,
  });

  const payload = data.redeemUsageExtensionCode;
  if (!payload?.usageQuotaResetAt) {
    throw new Error('No se pudo validar el código de extensión.');
  }

  await deviceRepository.applyUsageQuotaReset({
    cloudDeviceId,
    usageQuotaResetAt: payload.usageQuotaResetAt,
    trialLimitMinutes: payload.grantMinutes ?? null,
  });
}

export function parseUsageExtensionError(err: unknown): string {
  return parseEnrollmentError(err).message;
}
