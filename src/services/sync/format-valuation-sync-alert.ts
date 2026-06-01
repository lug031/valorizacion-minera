import type { SyncValuationsResult } from './sync-valuations.service';

export function formatValuationSyncAlert(result: SyncValuationsResult): { title: string; message: string } {
  if (result.attempted === 0) {
    return {
      title: 'Envío al panel',
      message:
        'No hay cotizaciones pendientes en este teléfono, o falta conexión o activación del dispositivo.',
    };
  }
  if (result.failed > 0) {
    return {
      title: 'Envío al panel',
      message: `Enviadas: ${result.synced}. Con error: ${result.failed}.${
        result.skipped > 0 ? ` Omitidas: ${result.skipped}.` : ''
      }`,
    };
  }
  return {
    title: 'Envío al panel',
    message: `Cotizaciones enviadas desde este teléfono: ${result.synced}.`,
  };
}
