import type { UserRole } from '../models/enums';

export const SYNC_ACCESS_DENIED_MESSAGE =
  'Solo administradores pueden sincronizar configuración maestra.';

export function canSyncMasterConfig(role?: UserRole | string | null): boolean {
  return role === 'admin';
}
