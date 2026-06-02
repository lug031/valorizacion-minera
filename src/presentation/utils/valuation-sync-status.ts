export type ValuationOutboxStatus = 'pending' | 'syncing' | 'synced' | 'error' | string;

export function valuationPanelSyncLabel(status: ValuationOutboxStatus | null | undefined): string {
  switch (status) {
    case 'synced':
      return 'Sincronizada';
    case 'pending':
      return 'Pendiente de sincronizar';
    case 'syncing':
      return 'Sincronizando…';
    case 'error':
      return 'Error al sincronizar';
    default:
      return 'Pendiente de sincronizar';
  }
}

export function valuationPanelSyncColor(status: ValuationOutboxStatus | null | undefined): string {
  switch (status) {
    case 'synced':
      return '#15803d';
    case 'error':
      return '#b42318';
    case 'syncing':
      return '#1d4ed8';
    default:
      return '#b45309';
  }
}
