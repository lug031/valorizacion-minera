import type { ValuationActor } from '../../domain/models/valuation-actor';
import type { AuthUser } from '../services/auth/auth-service';

export function authUserToValuationActor(user: AuthUser): ValuationActor {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
  };
}
