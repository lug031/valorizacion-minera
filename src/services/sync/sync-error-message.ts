export function extractSyncErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  if (typeof err === 'string' && err.trim()) return err;
  if (err && typeof err === 'object') {
    const message = (err as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
    const errors = (err as { errors?: Array<{ message?: string }> }).errors;
    if (errors?.length) {
      return errors.map((e) => e.message ?? 'Error de conexión con el servidor').join('; ');
    }
  }
  return 'Error desconocido de sincronización';
}

export function isDeviceSessionSyncError(message: string): boolean {
  const lowered = message.toLowerCase();
  return (
    lowered.includes('sesión de dispositivo') ||
    lowered.includes('session token') ||
    lowered.includes('invalid_session') ||
    lowered.includes('token de sesión') ||
    lowered.includes('inicie sesión nuevamente')
  );
}

export function mapConfigSyncErrorMessage(err: unknown): string {
  const msg = extractSyncErrorMessage(err);
  const lowered = msg.toLowerCase();
  if (
    lowered.includes('network') ||
    lowered.includes('offline') ||
    lowered.includes('timed out') ||
    lowered.includes('internet') ||
    lowered.includes('network request failed')
  ) {
    return 'Sin conexión a internet. Se mantiene la configuración local.';
  }
  if (lowered.includes('not authorized') || lowered.includes('unauthorized')) {
    return 'No tiene permisos para sincronizar configuración.';
  }
  if (isDeviceSessionSyncError(msg)) {
    return 'Sesión de dispositivo no válida. Cierre sesión y vuelva a entrar para sincronizar.';
  }
  return msg;
}
