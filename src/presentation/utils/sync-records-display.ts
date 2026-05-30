import type { SyncMetadata } from '../../services/sync/sync-config.types';

export interface SyncRecordRow {
  label: string;
  hint?: string;
  value: number;
}

/** Filas legibles para la tarjeta de conteos de sincronización. */
export function buildSyncRecordRows(metadata: SyncMetadata | null | undefined): SyncRecordRow[] {
  if (!metadata) return [];

  return [
    {
      label: 'Tipos de material (MAT)',
      value: metadata.recordsMaterialTypes,
    },
    {
      label: 'Rangos de maquila',
      value: metadata.recordsMaquilaRanges,
    },
    {
      label: 'Proveedores (catálogo)',
      hint: 'Contrapartes comerciales registradas en la web.',
      value: metadata.recordsProviders,
    },
    {
      label: 'Defaults por proveedor',
      hint: 'Parámetros comerciales vinculados a cada proveedor (puede ser menor si falta alguno).',
      value: metadata.recordsProviderDefaults,
    },
    {
      label: 'Configuración comercial global',
      hint: 'Registro maestro único (default) aplicado a nuevas cotizaciones.',
      value: metadata.recordsAppSettings,
    },
  ];
}

export function syncRecordsCardTitle(status: SyncMetadata['status'] | undefined): string {
  return status === 'success' ? 'Registros aplicados' : 'Registros recibidos de la nube';
}

export function syncRecordsCardSubtitle(status: SyncMetadata['status'] | undefined): string {
  if (status === 'success') {
    return 'Cantidades guardadas en SQLite en la última sincronización exitosa.';
  }
  if (status === 'error' || status === 'offline') {
    return 'Cantidades del último intento. Si falló, SQLite local no se modificó.';
  }
  return 'Conteos disponibles tras sincronizar.';
}
