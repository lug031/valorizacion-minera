/** Conteos de la cola local de envío al panel (SQLite). */
export interface ValuationSyncQueueCounts {
  pending: number;
  syncing: number;
  error: number;
  /** pending/error que no pueden enviarse hasta sincronizar usuarios de campo */
  skippedNoCloudUser: number;
}

export function totalAwaitingPanel(counts: ValuationSyncQueueCounts): number {
  return counts.pending + counts.syncing + counts.error;
}
