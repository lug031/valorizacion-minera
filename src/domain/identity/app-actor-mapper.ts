import type { AppActor } from '../models/app-actor';
import type { AuthSource } from '../models/enums';
import type { User } from '../models/user';
import type { ValuationActor } from '../models/valuation-actor';

export function userToAppActor(user: User): AppActor {
  return {
    id: user.id,
    cloudUserId: user.cloudUserId,
    authSource: user.authSource,
    username: user.username,
    role: user.role,
    displayName: user.displayName ?? user.username,
  };
}

export function appActorToValuationActor(actor: AppActor): ValuationActor {
  return {
    id: actor.id,
    cloudUserId: actor.cloudUserId,
    username: actor.username,
    role: actor.role,
  };
}

/** Valores por defecto para usuarios seed o filas legacy sin columnas de identidad. */
export function resolveAuthSource(value: string | null | undefined): AuthSource {
  if (value === 'local_provisioned' || value === 'cognito' || value === 'local_seed') {
    return value;
  }
  return 'local_seed';
}
