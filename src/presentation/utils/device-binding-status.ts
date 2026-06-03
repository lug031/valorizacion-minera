import { DEFAULT_GRACE_DAYS_OFFLINE } from '../../domain/constants/device-binding';
import type { DeviceRegistration } from '../../domain/models/user';

export type DeviceAuthorizationBannerTone = 'info' | 'warning';

export type DeviceAuthorizationBannerModel = {
  tone: DeviceAuthorizationBannerTone;
  lines: string[];
};

function resolveGraceDays(device: DeviceRegistration): number {
  const fromDevice = device.graceDaysOffline;
  if (typeof fromDevice === 'number' && fromDevice > 0 && fromDevice <= 90) {
    return fromDevice;
  }
  return DEFAULT_GRACE_DAYS_OFFLINE;
}

function formatPeDateTime(iso: string): string {
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

/**
 * Textos para dashboard: última confirmación, límite de gracia y validez administrativa.
 */
export function buildDeviceAuthorizationBanner(
  device: DeviceRegistration | null,
  now: Date = new Date()
): DeviceAuthorizationBannerModel | null {
  if (!device || device.enrollmentStatus !== 'enrolled') {
    return null;
  }

  const lines: string[] = [];
  let tone: DeviceAuthorizationBannerTone = 'info';

  const anchor = device.lastSyncAt ?? device.registeredAt;
  if (anchor) {
    lines.push(`Última confirmación con servidor: ${formatPeDateTime(anchor)}`);
    const graceDays = resolveGraceDays(device);
    const graceLimitMs =
      new Date(anchor).getTime() + graceDays * 24 * 60 * 60 * 1000;
    const hoursLeft = (graceLimitMs - now.getTime()) / (60 * 60 * 1000);
    lines.push(
      `Debe conectarse antes de: ${formatPeDateTime(new Date(graceLimitMs).toISOString())} (${graceDays} día de gracia)`
    );
    if (hoursLeft <= 0) {
      tone = 'warning';
    } else if (hoursLeft <= 4) {
      tone = 'warning';
    }
  }

  if (device.validUntil) {
    lines.push(`Autorizado por administrador hasta: ${formatPeDateTime(device.validUntil)}`);
    if (now.getTime() > new Date(device.validUntil).getTime()) {
      tone = 'warning';
    } else {
      const hoursToValid = (new Date(device.validUntil).getTime() - now.getTime()) / (60 * 60 * 1000);
      if (hoursToValid <= 24) {
        tone = 'warning';
      }
    }
  }

  if (lines.length === 0) {
    return null;
  }

  return { tone, lines };
}
