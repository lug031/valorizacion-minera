import type { UserRole } from '../models/enums';

export const SYNC_ACCESS_DENIED_MESSAGE =
  'No tiene permiso para descargar la configuración maestra.';

/** Cualquier perfil con acceso a la app (admin u operador) descarga config maestra automáticamente. */
export function canSyncMasterConfig(role?: UserRole | string | null): boolean {
  return role === 'admin' || role === 'operador';
}
