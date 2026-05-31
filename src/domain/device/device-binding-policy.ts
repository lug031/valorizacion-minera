import type { DeviceRegistration } from '../models/user';
import { DEFAULT_GRACE_DAYS_OFFLINE } from '../constants/device-binding';

export type DeviceBindingPolicyResult =
  | { ok: true }
  | { ok: false; reason: 'not_enrolled' | 'blocked' | 'expired' | 'revoked' | 'stale_sync'; message: string };

export function evaluateBindingPolicy(
  device: DeviceRegistration,
  lastSyncAt: string | null,
  now: Date
): DeviceBindingPolicyResult {
  if (device.enrollmentStatus === 'revoked') {
    return {
      ok: false,
      reason: 'revoked',
      message: 'Este dispositivo fue revocado. Contacte al administrador.',
    };
  }

  if (device.isBlocked) {
    return {
      ok: false,
      reason: 'blocked',
      message: 'Este dispositivo está suspendido. Contacte al administrador.',
    };
  }

  const graceDays = DEFAULT_GRACE_DAYS_OFFLINE;
  const syncAnchor = lastSyncAt ?? device.lastSyncAt ?? device.registeredAt;
  const anchorMs = new Date(syncAnchor).getTime();
  const graceLimit = anchorMs + graceDays * 24 * 60 * 60 * 1000;

  if (device.validUntil) {
    const validUntilMs = new Date(device.validUntil).getTime();
    if (now.getTime() > validUntilMs && now.getTime() > graceLimit) {
      return {
        ok: false,
        reason: 'expired',
        message: 'La licencia de este dispositivo expiró. Contacte al administrador.',
      };
    }
  }

  if (now.getTime() > graceLimit) {
    return {
      ok: false,
      reason: 'stale_sync',
      message: 'Debe conectarse a internet para validar la licencia del dispositivo.',
    };
  }

  return { ok: true };
}
