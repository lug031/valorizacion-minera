import type { SyncValuationsResult } from './sync-valuations.service';

export function formatValuationSyncAlert(result: SyncValuationsResult): { title: string; message: string } {
  if (result.attempted === 0 && result.recoveredOrphans === 0) {
    return {
      title: 'Envío al panel',
      message:
        'No hay cotizaciones pendientes en este teléfono, o falta conexión o activación del dispositivo.',
    };
  }

  const skippedPart =
    result.skipped > 0
      ? ` ${result.skipped} omitida(s): sincronice usuarios de campo (paso 1) para registrar operadores locales en el sistema central.`
      : '';

  const recoveredPart =
    result.recoveredOrphans > 0
      ? ` Se reintentaron ${result.recoveredOrphans} envío(s) interrumpido(s).`
      : '';

  if (result.failed > 0) {
    return {
      title: 'Envío al panel',
      message: `Enviadas: ${result.synced}. Con error: ${result.failed}.${skippedPart}${recoveredPart}`,
    };
  }

  if (result.skipped > 0 && result.synced === 0) {
    return {
      title: 'Envío al panel',
      message: `Ninguna cotización se envió.${skippedPart}${recoveredPart}`,
    };
  }

  return {
    title: 'Envío al panel',
    message: `Cotizaciones enviadas desde este teléfono: ${result.synced}.${skippedPart}${recoveredPart}`,
  };
}
