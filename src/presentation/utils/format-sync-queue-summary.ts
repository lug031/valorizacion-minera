import type { ValuationSyncQueueCounts } from '../../data/repositories/valuation-sync-queue';
import { totalAwaitingPanel } from '../../data/repositories/valuation-sync-queue';

/** Texto breve para banner (historial / dashboard). */
export function formatSyncQueueBanner(counts: ValuationSyncQueueCounts): string | null {
  const total = totalAwaitingPanel(counts);
  if (total === 0) return null;

  const parts: string[] = [`${total} cotización(es) de este teléfono sin enviar al panel`];
  if (counts.error > 0) parts.push(`${counts.error} con error`);
  if (counts.syncing > 0) parts.push(`${counts.syncing} en envío`);
  if (counts.skippedNoCloudUser > 0) {
    parts.push(
      `${counts.skippedNoCloudUser} requieren sincronizar usuarios de campo (operador local sin registro central)`
    );
  }
  return parts.join(' · ');
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
