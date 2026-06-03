import type { ValuationSyncQueueCounts } from '../../data/repositories/valuation-sync-queue';
import { totalAwaitingPanel } from '../../data/repositories/valuation-sync-queue';

export type SyncQueueBannerContext = 'dashboard' | 'historial';

function pendingSyncSummary(count: number): string {
  if (count === 1) return '1 cotización pendiente de sincronizar';
  return `${count} cotizaciones pendientes de sincronizar`;
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

  const summary = pendingSyncSummary(total);
  let base: string;
  if (!isConnected) {
    base = `Tiene ${summary}. Se sincronizarán solas al tener internet.`;
  } else if (context === 'historial') {
    base = `Tiene ${summary}.`;
  } else {
    base = `Tiene ${summary}. Revise Historial.`;
  }

  const extras: string[] = [];
  if (counts.error > 0) {
    extras.push(counts.error === 1 ? '1 con error' : `${counts.error} con error`);
  }

  if (extras.length === 0) return base;
  return `${base} (${extras.join('; ')}).`;
}

/** Detalle para pantalla de administración / sincronizar. */
export function formatSyncQueueDiagnostics(counts: ValuationSyncQueueCounts): string {
  const lines = [
    `Pendientes de sincronizar: ${counts.pending}`,
    `En sincronización: ${counts.syncing}`,
    `Con error: ${counts.error}`,
    `Omitidas (sin usuario central): ${counts.skippedNoCloudUser}`,
  ];
  const total = totalAwaitingPanel(counts);
  if (total === 0) return 'Ninguna cotización pendiente de sincronización en este teléfono.';
  return lines.join('\n');
}

export const SAVE_OFFLINE_HISTORIAL_NOTICE =
  'Guardada en este teléfono. Se sincronizará cuando haya internet.';
