import type { SyncValuationsResult } from './sync-valuations.service';
import { totalAwaitingPanel } from '../../data/repositories/valuation-sync-queue';
import type { ValuationSyncQueueCounts } from '../../data/repositories/valuation-sync-queue';

export interface ValuationSyncAlertContext {
  /** Cola local tras el intento de envío (para mensajes cuando attempted === 0). */
  queueAfter?: ValuationSyncQueueCounts;
}

export function formatValuationSyncAlert(
  result: SyncValuationsResult,
  context: ValuationSyncAlertContext = {}
): { title: string; message: string } {
  const pendingAfter = context.queueAfter ? totalAwaitingPanel(context.queueAfter) : null;

  if (result.attempted === 0 && result.recoveredOrphans === 0) {
    if (pendingAfter === 0) {
      return {
        title: 'Envío al panel',
        message:
          'No había cotizaciones pendientes. Si acaba de guardar, es probable que el envío automático ya las haya subido.',
      };
    }
    return {
      title: 'Envío al panel',
      message:
        'No se pudo enviar ahora. Revise conexión a internet y que el dispositivo siga activado en el panel web.',
    };
  }

  const skippedPart =
    result.skipped > 0
      ? ` ${result.skipped} no se enviaron: son de otro usuario local de este teléfono (p. ej. admin de prueba). Actualice usuarios en Configuración o elimínelas.`
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
    message: `Cotizaciones enviadas: ${result.synced}.${skippedPart}${recoveredPart}`,
  };
}
