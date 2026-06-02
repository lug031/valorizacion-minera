const CODE_RE = /^\[([A-Z_]+)\]\s*(.*)$/;

export type ValuationSyncErrorCode =
  | 'NETWORK_ERROR'
  | 'INVALID_SESSION_TOKEN'
  | 'INVALID_PAYLOAD'
  | 'PAYLOAD_TOO_LARGE'
  | 'DEVICE_NOT_FOUND'
  | 'DEVICE_NOT_ENROLLED'
  | 'DEVICE_BLOCKED'
  | 'DEVICE_REVOKED'
  | 'FIELD_USER_INACTIVE'
  | 'UNKNOWN';

export function parseValuationSyncError(err: unknown): { code: ValuationSyncErrorCode; message: string } {
  const message = err instanceof Error ? err.message : String(err);
  const lowered = message.toLowerCase();

  if (
    lowered.includes('network') ||
    lowered.includes('offline') ||
    lowered.includes('failed to fetch')
  ) {
    return { code: 'NETWORK_ERROR', message: 'Sin conexión para enviar la cotización.' };
  }

  const match = message.match(CODE_RE);
  if (match) {
    return { code: match[1] as ValuationSyncErrorCode, message: match[2] || message };
  }

  return { code: 'UNKNOWN', message };
}

export function valuationSyncErrorMessage(code: ValuationSyncErrorCode, fallback: string): string {
  switch (code) {
    case 'NETWORK_ERROR':
      return 'Sin conexión para enviar la cotización.';
    case 'DEVICE_BLOCKED':
    case 'DEVICE_REVOKED':
    case 'DEVICE_NOT_ENROLLED':
      return 'Este teléfono no está autorizado para enviar cotizaciones.';
    case 'FIELD_USER_INACTIVE':
      return 'Usuario de campo desactivado. Contacte al administrador.';
    case 'PAYLOAD_TOO_LARGE':
      return 'La cotización es demasiado grande para enviar.';
    case 'INVALID_SESSION_TOKEN':
      return 'Sesión expirada. Inicie sesión nuevamente para continuar sincronizando.';
    case 'INVALID_PAYLOAD':
      return fallback || 'Datos de cotización inválidos.';
    default:
      return fallback || 'No se pudo enviar la cotización al servidor.';
  }
}
