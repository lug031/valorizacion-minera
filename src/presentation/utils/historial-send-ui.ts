import type { ValuationSyncQueueCounts } from '../../data/repositories/valuation-sync-queue';
import { totalAwaitingPanel } from '../../data/repositories/valuation-sync-queue';
import { formatSyncQueueBanner } from './format-sync-queue-summary';

export interface HistorialSendUiState {
  showBanner: boolean;
  showSendButton: boolean;
  sendButtonLabel: string;
  bannerText: string;
}

/**
 * Historial offline-first: aviso informativo sin red; botón solo si hay error de sincronización.
 */
export function resolveHistorialSendUi(
  counts: ValuationSyncQueueCounts,
  isConnected: boolean
): HistorialSendUiState | null {
  const total = totalAwaitingPanel(counts);
  if (total === 0) return null;

  const baseBanner =
    formatSyncQueueBanner(counts, { context: 'historial', isConnected }) ?? '';
  const hasErrors = counts.error > 0;
  const onlySkipped =
    !hasErrors &&
    counts.pending > 0 &&
    counts.skippedNoCloudUser >= counts.pending &&
    counts.syncing === 0;

  if (onlySkipped) {
    return {
      showBanner: true,
      showSendButton: false,
      sendButtonLabel: '',
      bannerText: baseBanner,
    };
  }

  if (!isConnected) {
    return {
      showBanner: true,
      showSendButton: false,
      sendButtonLabel: '',
      bannerText: baseBanner,
    };
  }

  if (hasErrors) {
    return {
      showBanner: true,
      showSendButton: true,
      sendButtonLabel: 'Reintentar sincronización',
      bannerText: baseBanner,
    };
  }

  return null;
}
