import type { AuthSource, UserRole } from './enums';

/**
 * Actor de sesión unificado (operativo offline o futuro cloud).
 * `id` es siempre el identificador local SQLite (`users.id`).
 * `cloudUserId` reserva espacio para Cognito sub / id provisionado desde web.
 */
export interface AppActor {
  id: string;
  cloudUserId: string | null;
  authSource: AuthSource;
  username: string;
  role: UserRole;
  displayName: string;
}
