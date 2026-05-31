import NetInfo from '@react-native-community/netinfo';
import { DEVICE_BINDING_REQUIRED } from '../domain/constants/device-binding';
import { evaluateBindingPolicy } from '../domain/device/device-binding-policy';
import { deviceRepository } from '../data/repositories';
import { getEnrollmentMode } from '../infrastructure/device/enrollment-store';
import { syncFieldDeviceStatusIfEnrolled } from './device/device-status-sync.service';

export type DeviceBindingCheckResult =
  | { ok: true; skipped: true; reason: 'binding_not_required' | 'legacy_mode' }
  | { ok: true; skipped: false }
  | { ok: false; reason: 'not_enrolled' | 'blocked' | 'expired' | 'revoked' | 'stale_sync'; message: string };

export async function validateDeviceBindingOnStartup(): Promise<DeviceBindingCheckResult> {
  const mode = await getEnrollmentMode();
  if (mode !== 'enrolled') {
    return { ok: true, skipped: true, reason: 'legacy_mode' };
  }

  const device = await deviceRepository.getEnrolledDevice();
  if (!device) {
    if (!DEVICE_BINDING_REQUIRED) {
      return { ok: true, skipped: true, reason: 'binding_not_required' };
    }
    return {
      ok: false,
      reason: 'not_enrolled',
      message: 'Este teléfono no está activado. Use «Activar dispositivo».',
    };
  }

  const net = await NetInfo.fetch();
  if (net.isConnected) {
    await syncFieldDeviceStatusIfEnrolled();
  }

  const refreshed = (await deviceRepository.getEnrolledDevice()) ?? device;
  const policy = evaluateBindingPolicy(refreshed, refreshed.lastSyncAt, new Date());

  if (!policy.ok && !DEVICE_BINDING_REQUIRED) {
    return { ok: true, skipped: false };
  }

  if (!policy.ok) {
    return { ok: false, reason: policy.reason, message: policy.message };
  }

  return { ok: true, skipped: false };
}

export { evaluateBindingPolicy } from '../domain/device/device-binding-policy';
