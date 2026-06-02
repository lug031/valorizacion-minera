import type { SyncValuationsResult } from './sync-valuations.service';
import { totalAwaitingPanel } from '../../data/repositories/valuation-sync-queue';
import type { ValuationSyncQueueCounts } from '../../data/repositories/valuation-sync-queue';

const SYNC_ALERT_TITLE = 'Sincronización de cotizaciones';

export interface ValuationSyncAlertContext {
  /** Cola local tras el intento de sincronización (para mensajes cuando attempted === 0). */
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
        title: SYNC_ALERT_TITLE,
        message:
          'No había cotizaciones pendientes. Si acaba de guardar, es probable que la sincronización automática ya las haya subido.',
      };
    }
    return {
      title: SYNC_ALERT_TITLE,
      message:
        'No se pudo sincronizar ahora. Revise conexión a internet y que el dispositivo siga activo.',
    };
  }

  const skippedPart =
    result.skipped > 0
      ? ` ${result.skipped} no se sincronizaron: son de otro usuario local de este teléfono (p. ej. admin de prueba). Actualice usuarios en Configuración o elimínelas.`
      : '';

  const recoveredPart =
    result.recoveredOrphans > 0
      ? ` Se reintentaron ${result.recoveredOrphans} sincronización(es) interrumpida(s).`
      : '';

  if (result.failed > 0) {
    return {
      title: SYNC_ALERT_TITLE,
      message: `Sincronizadas: ${result.synced}. Con error: ${result.failed}.${skippedPart}${recoveredPart}`,
    };
  }

  if (result.skipped > 0 && result.synced === 0) {
    return {
      title: SYNC_ALERT_TITLE,
      message: `Ninguna cotización se sincronizó.${skippedPart}${recoveredPart}`,
    };
  }

  return {
    title: SYNC_ALERT_TITLE,
    message: `Cotizaciones sincronizadas: ${result.synced}.${skippedPart}${recoveredPart}`,
  };
}
