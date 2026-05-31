import type { UserRole } from './enums';

/** Usuario que ejecuta una acción sobre una valorización (sesión local o futura cloud). */
export interface ValuationActor {
  /** Identificador local SQLite (`users.id`). */
  id: string;
  cloudUserId?: string | null;
  username: string;
  role: UserRole;
}
