import type { SyncMetadata } from '../../services/sync/sync-config.types';

export interface SyncRecordRow {
  label: string;
  value: number;
}

/** Resumen breve para operadores (sin detalle técnico de backend). */
export function buildSyncRecordRows(metadata: SyncMetadata | null | undefined): SyncRecordRow[] {
  if (!metadata) return [];

  return [
    { label: 'Materiales', value: metadata.recordsMaterialTypes },
    { label: 'Rangos de maquila', value: metadata.recordsMaquilaRanges },
    { label: 'Proveedores', value: metadata.recordsProviders },
  ];
}

export function syncRecordsCardTitle(status: SyncMetadata['status'] | undefined): string {
  return status === 'success' ? 'Registros aplicados' : 'Último intento de sincronización';
}

export function syncRecordsCardSubtitle(status: SyncMetadata['status'] | undefined): string | null {
  if (status === 'success') {
    return 'Incluye también los valores comerciales base para nuevas cotizaciones.';
  }
  if (status === 'error' || status === 'offline') {
    return 'Si hubo error, se conserva la configuración local anterior.';
  }
  return null;
}
