import type { DeviceRegistration } from '../models/user';
import { DEFAULT_GRACE_DAYS_OFFLINE } from '../constants/device-binding';

function resolveGraceDays(device: DeviceRegistration): number {
  const fromDevice = device.graceDaysOffline;
  if (typeof fromDevice === 'number' && fromDevice > 0 && fromDevice <= 90) {
    return fromDevice;
  }
  return DEFAULT_GRACE_DAYS_OFFLINE;
}

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
      message: 'Este teléfono fue retirado por el administrador. Solicite un nuevo código de activación.',
    };
  }

  if (device.isBlocked) {
    return {
      ok: false,
      reason: 'blocked',
      message: 'Este teléfono está suspendido temporalmente. Contacte al administrador.',
    };
  }

  const graceDays = resolveGraceDays(device);
  const syncAnchor = lastSyncAt ?? device.lastSyncAt ?? device.registeredAt;
  const anchorMs = new Date(syncAnchor).getTime();
  const graceLimit = anchorMs + graceDays * 24 * 60 * 60 * 1000;

  if (device.validUntil) {
    const validUntilMs = new Date(device.validUntil).getTime();
    if (now.getTime() > validUntilMs && now.getTime() > graceLimit) {
      return {
        ok: false,
        reason: 'expired',
        message: 'La autorización de este teléfono venció. Contacte al administrador para renovarla.',
      };
    }
  }

  if (now.getTime() > graceLimit) {
    return {
      ok: false,
      reason: 'stale_sync',
      message: 'Conéctese a internet para confirmar que este teléfono sigue autorizado.',
    };
  }

  return { ok: true };
}
