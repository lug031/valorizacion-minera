import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { buildFingerprintRaw, FINGERPRINT_VERSION } from '../../domain/device/device-fingerprint';
import { getDeviceInstallId, setDeviceInstallId } from '../../infrastructure/device/enrollment-store';

export { FINGERPRINT_VERSION, buildFingerprintRaw };

const HASH_PREFIX = 'vm-sha256:';

export function resolveApplicationId(): string {
  return (
    Constants.expoConfig?.android?.package ??
    Constants.expoConfig?.ios?.bundleIdentifier ??
    'com.valorizacion.minera'
  );
}

export async function hashFingerprintRaw(raw: string): Promise<string> {
  const hex = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw, {
    encoding: Crypto.CryptoEncoding.HEX,
  });
  return `${HASH_PREFIX}${hex}`;
}

async function getOrCreateInstallId(): Promise<string> {
  const existing = await getDeviceInstallId();
  if (existing) return existing;
  const installId = Crypto.randomUUID();
  await setDeviceInstallId(installId);
  return installId;
}

export async function getDeviceFingerprintHash(): Promise<string> {
  const installId = await getOrCreateInstallId();
  const raw = buildFingerprintRaw(
    installId,
    resolveApplicationId(),
    Platform.OS,
    Constants.deviceName ?? 'unknown',
    String(Platform.Version ?? 'unknown')
  );
  return hashFingerprintRaw(raw);
}
