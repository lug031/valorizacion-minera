export const FINGERPRINT_VERSION = 'v1';

export function buildFingerprintRaw(
  installId: string,
  applicationId: string,
  platform: string,
  modelName: string,
  osVersion: string
): string {
  return `${FINGERPRINT_VERSION}|${installId}|${applicationId}|${platform}|${modelName}|${osVersion}`;
}
