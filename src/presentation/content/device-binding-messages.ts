import type { DeviceBindingCheckResult } from '../../services/device-binding.service';

export interface DeviceBindingScreenContent {
  title: string;
  body: string;
  showRetry: boolean;
  showActivateLink: boolean;
  showLogout: boolean;
}

export function getDeviceBindingScreenContent(
  result: DeviceBindingCheckResult | null
): DeviceBindingScreenContent {
  if (!result || result.ok) {
    return {
      title: 'Dispositivo no autorizado',
      body: 'No se pudo validar la licencia de este teléfono.',
      showRetry: true,
      showActivateLink: false,
      showLogout: true,
    };
  }

  switch (result.reason) {
    case 'revoked':
      return {
        title: 'Dispositivo revocado',
        body: result.message,
        showRetry: true,
        showActivateLink: false,
        showLogout: true,
      };
    case 'blocked':
      return {
        title: 'Dispositivo suspendido',
        body: result.message,
        showRetry: true,
        showActivateLink: false,
        showLogout: true,
      };
    case 'expired':
      return {
        title: 'Licencia expirada',
        body: result.message,
        showRetry: true,
        showActivateLink: false,
        showLogout: true,
      };
    case 'stale_sync':
      return {
        title: 'Validación requerida',
        body: result.message,
        showRetry: true,
        showActivateLink: false,
        showLogout: true,
      };
    case 'not_enrolled':
      return {
        title: 'Dispositivo no activado',
        body: result.message,
        showRetry: false,
        showActivateLink: true,
        showLogout: true,
      };
    default: {
      const fallback = result as { ok: false; message: string };
      return {
        title: 'Dispositivo no autorizado',
        body: fallback.message,
        showRetry: true,
        showActivateLink: false,
        showLogout: true,
      };
    }
  }
}
