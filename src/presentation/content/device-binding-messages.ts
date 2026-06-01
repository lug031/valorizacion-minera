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
      title: 'Acceso no permitido',
      body: 'No se pudo verificar la autorización de este teléfono.',
      showRetry: true,
      showActivateLink: false,
      showLogout: true,
    };
  }

  switch (result.reason) {
    case 'revoked':
      return {
        title: 'Teléfono desautorizado',
        body: 'Este teléfono fue retirado por el administrador. Solicite un nuevo código de activación.',
        showRetry: true,
        showActivateLink: false,
        showLogout: true,
      };
    case 'blocked':
      return {
        title: 'Teléfono suspendido',
        body: 'Este teléfono está suspendido temporalmente. Contacte al administrador.',
        showRetry: true,
        showActivateLink: false,
        showLogout: true,
      };
    case 'expired':
      return {
        title: 'Autorización vencida',
        body: 'La autorización de este teléfono venció. Contacte al administrador para renovarla.',
        showRetry: true,
        showActivateLink: false,
        showLogout: true,
      };
    case 'stale_sync':
      return {
        title: 'Verificación requerida',
        body: 'Conéctese a internet para confirmar que este teléfono sigue autorizado.',
        showRetry: true,
        showActivateLink: false,
        showLogout: true,
      };
    case 'not_enrolled':
      return {
        title: 'Teléfono sin activar',
        body: 'Este teléfono aún no está activado. Use el código que le envió el administrador.',
        showRetry: false,
        showActivateLink: true,
        showLogout: true,
      };
    default: {
      const fallback = result as { ok: false; message: string };
      return {
        title: 'Acceso no permitido',
        body: fallback.message,
        showRetry: true,
        showActivateLink: false,
        showLogout: true,
      };
    }
  }
}
