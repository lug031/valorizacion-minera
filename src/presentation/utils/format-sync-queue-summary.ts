import type { ValuationSyncQueueCounts } from '../../data/repositories/valuation-sync-queue';
import { totalAwaitingPanel } from '../../data/repositories/valuation-sync-queue';

export type SyncQueueBannerContext = 'dashboard' | 'historial';

function cotizacionesLabel(count: number): string {
  return count === 1 ? '1 cotización' : `${count} cotizaciones`;
}

export interface SyncQueueBannerOptions {
  context?: SyncQueueBannerContext;
  isConnected?: boolean;
}

/** Texto breve para banner (dashboard / historial), pensado para uso mayormente offline. */
export function formatSyncQueueBanner(
  counts: ValuationSyncQueueCounts,
  options: SyncQueueBannerOptions = {}
): string | null {
  const { context = 'dashboard', isConnected = true } = options;
  const total = totalAwaitingPanel(counts);
  if (total === 0) return null;

  let base: string;
  if (!isConnected) {
    base = `Tiene ${cotizacionesLabel(total)} sin enviar al panel. Se subirán solas al tener internet.`;
  } else if (context === 'historial') {
    base = `Tiene ${cotizacionesLabel(total)} sin enviar al panel.`;
  } else {
    base = `Tiene ${cotizacionesLabel(total)} sin enviar al panel. Revise Historial.`;
  }

  const extras: string[] = [];
  if (counts.error > 0) {
    extras.push(counts.error === 1 ? '1 con error' : `${counts.error} con error`);
  }
  if (counts.skippedNoCloudUser > 0) {
    extras.push('algunas requieren actualizar usuarios en Configuración');
  }

  if (extras.length === 0) return base;
  return `${base} (${extras.join('; ')}).`;
}

/** Detalle para pantalla de administración / sincronizar. */
export function formatSyncQueueDiagnostics(counts: ValuationSyncQueueCounts): string {
  const lines = [
    `Pendientes: ${counts.pending}`,
    `En envío (syncing): ${counts.syncing}`,
    `Con error: ${counts.error}`,
    `Omitidas (sin usuario central): ${counts.skippedNoCloudUser}`,
  ];
  const total = totalAwaitingPanel(counts);
  if (total === 0) return 'Ninguna cotización pendiente de envío en este teléfono.';
  return lines.join('\n');
}

export const SAVE_OFFLINE_HISTORIAL_NOTICE =
  'Guardada en este teléfono. Se enviará al panel cuando haya internet.';
