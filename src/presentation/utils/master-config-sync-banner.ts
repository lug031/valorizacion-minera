import type { SyncMetadata } from '../../services/sync/sync-config.types';
import { isDeviceSessionSyncError } from '../../services/sync/sync-error-message';

export interface MasterConfigBannerState {
  message: string;
  tone: 'warning' | 'error' | 'info';
}

function isEffectivelyOffline(isConnected: boolean, isInternetReachable?: boolean | null): boolean {
  if (!isConnected) return true;
  return isInternetReachable === false;
}

export function resolveMasterConfigBanner(input: {
  isConnected: boolean;
  isInternetReachable?: boolean | null;
  metadata: SyncMetadata | null;
}): MasterConfigBannerState | null {
  if (isEffectivelyOffline(input.isConnected, input.isInternetReachable)) {
    return {
      tone: 'warning',
      message:
        'Sin conexión a internet. Active los datos móviles o Wi‑Fi para obtener los últimos valores (INTER, factor, tipos MAT, maquila, etc.).',
    };
  }

  const meta = input.metadata;
  if (!meta?.lastSyncAt) {
    return {
      tone: 'warning',
      message:
        'Aún no se han descargado los valores de la web en este teléfono. Mantenga internet activo unos segundos.',
    };
  }

  if (meta.status === 'offline') {
    return {
      tone: 'warning',
      message:
        meta.errorMessage ??
        'Sin conexión al sincronizar. Active internet para actualizar los valores comerciales.',
    };
  }

  if (meta.status === 'error') {
    const errMsg = meta.errorMessage ?? '';
    const sessionStale =
      Boolean(meta.lastSyncAt) && errMsg && isDeviceSessionSyncError(errMsg);
    return {
      tone: sessionStale ? 'warning' : 'error',
      message: sessionStale
        ? 'Hay valores descargados en el teléfono. Para comprobar cambios nuevos, cierre sesión y vuelva a entrar.'
        : errMsg ||
          'No se pudieron actualizar los valores desde la web. Revise la conexión e intente de nuevo.',
    };
  }

  return null;
}
