import type { SyncMetadata } from '../../services/sync/sync-config.types';

export interface MasterConfigBannerState {
  message: string;
  tone: 'warning' | 'error' | 'info';
}

export function resolveMasterConfigBanner(input: {
  isConnected: boolean;
  metadata: SyncMetadata | null;
}): MasterConfigBannerState | null {
  if (!input.isConnected) {
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
    return {
      tone: 'error',
      message:
        meta.errorMessage ??
        'No se pudieron actualizar los valores desde la web. Revise la conexión e intente de nuevo.',
    };
  }

  return null;
}
