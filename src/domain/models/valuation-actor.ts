import type { UserRole } from './enums';

/** Usuario que ejecuta una acción sobre una valorización (sesión local o futura cloud). */
export interface ValuationActor {
  id: string;
  username: string;
  role: UserRole;
}
