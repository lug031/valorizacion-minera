import NetInfo from '@react-native-community/netinfo';
import { isDeviceEnrollmentRequired } from '../config/device-enrollment-required';
import { DEVICE_BINDING_REQUIRED } from '../domain/constants/device-binding';
import { evaluateBindingPolicy } from '../domain/device/device-binding-policy';
import { deviceRepository } from '../data/repositories';
import { getCloudDeviceId, getEnrollmentMode } from '../infrastructure/device/enrollment-store';
import { syncFieldDeviceStatusIfEnrolled } from './device/device-status-sync.service';

export type DeviceBindingBlockReason =
  | 'not_enrolled'
  | 'blocked'
  | 'expired'
  | 'revoked'
  | 'stale_sync';

export type DeviceBindingCheckResult =
  | { ok: true; skipped: true; reason: 'binding_not_required' | 'legacy_mode' }
  | { ok: true; skipped: false }
  | { ok: false; reason: DeviceBindingBlockReason; message: string };

export async function validateDeviceBindingOnStartup(): Promise<DeviceBindingCheckResult> {
  const mode = await getEnrollmentMode();
  if (mode !== 'enrolled') {
    if (isDeviceEnrollmentRequired()) {
      return {
        ok: false,
        reason: 'not_enrolled',
        message: 'Este teléfono no está activado. Use «Activar dispositivo» con el código del administrador.',
      };
    }
    return { ok: true, skipped: true, reason: 'legacy_mode' };
  }

  const cloudDeviceId = await getCloudDeviceId();
  let device = await deviceRepository.getBindingDevice(cloudDeviceId);

  if (!device) {
    if (!DEVICE_BINDING_REQUIRED) {
      return { ok: true, skipped: true, reason: 'binding_not_required' };
    }
    return {
      ok: false,
      reason: 'not_enrolled',
      message: 'Este teléfono no está activado. Use «Activar dispositivo» con el código del administrador.',
    };
  }

  const net = await NetInfo.fetch();
  if (net.isConnected) {
    await syncFieldDeviceStatusIfEnrolled();
    device = (await deviceRepository.getBindingDevice(cloudDeviceId)) ?? device;
  }

  const policy = evaluateBindingPolicy(device, device.lastSyncAt, new Date());

  if (!policy.ok && !DEVICE_BINDING_REQUIRED) {
    return { ok: true, skipped: false };
  }

  if (!policy.ok) {
    return { ok: false, reason: policy.reason, message: policy.message };
  }

  return { ok: true, skipped: false };
}

export { evaluateBindingPolicy } from '../domain/device/device-binding-policy';
