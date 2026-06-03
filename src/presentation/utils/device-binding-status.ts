import type { DeviceRegistration } from '../../domain/models/user';

export type DeviceAuthorizationBannerTone = 'info' | 'warning';

export type DeviceAuthorizationBannerModel = {
  tone: DeviceAuthorizationBannerTone;
  lines: string[];
};

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

/** Textos para dashboard: solo validez administrativa (sin gracia ni última sync). */
export function buildDeviceAuthorizationBanner(
  device: DeviceRegistration | null,
  now: Date = new Date()
): DeviceAuthorizationBannerModel | null {
  if (!device || device.enrollmentStatus !== 'enrolled') {
    return null;
  }

  const lines: string[] = [];
  let tone: DeviceAuthorizationBannerTone = 'info';

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
