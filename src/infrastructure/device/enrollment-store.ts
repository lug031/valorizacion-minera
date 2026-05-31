import * as SecureStore from 'expo-secure-store';

export type EnrollmentMode = 'legacy_roster' | 'enrolled';

const KEYS = {
  installId: 'vm_device_install_id',
  cloudDeviceId: 'vm_cloud_device_id',
  enrollmentMode: 'vm_enrollment_mode',
  lastDeviceSyncAt: 'vm_last_device_sync_at',
} as const;

export async function getDeviceInstallId(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.installId);
}

export async function setDeviceInstallId(installId: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.installId, installId);
}

export async function getCloudDeviceId(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.cloudDeviceId);
}

export async function setCloudDeviceId(cloudDeviceId: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.cloudDeviceId, cloudDeviceId);
}

export async function getEnrollmentMode(): Promise<EnrollmentMode | null> {
  const raw = await SecureStore.getItemAsync(KEYS.enrollmentMode);
  if (raw === 'enrolled' || raw === 'legacy_roster') return raw;
  return null;
}

export async function setEnrollmentMode(mode: EnrollmentMode): Promise<void> {
  await SecureStore.setItemAsync(KEYS.enrollmentMode, mode);
}

export async function getLastDeviceSyncAt(): Promise<string | null> {
  return SecureStore.getItemAsync(KEYS.lastDeviceSyncAt);
}

export async function setLastDeviceSyncAt(iso: string): Promise<void> {
  await SecureStore.setItemAsync(KEYS.lastDeviceSyncAt, iso);
}
