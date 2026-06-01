export type ValuationOutboxStatus = 'pending' | 'syncing' | 'synced' | 'error' | string;

export function valuationPanelSyncLabel(status: ValuationOutboxStatus | null | undefined): string {
  switch (status) {
    case 'synced':
      return 'Enviada al panel';
    case 'pending':
      return 'Pendiente de envío';
    case 'syncing':
      return 'Enviando…';
    case 'error':
      return 'Error al enviar';
    default:
      return 'Pendiente de envío';
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
