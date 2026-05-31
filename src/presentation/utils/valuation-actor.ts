import type { AppActor } from '../../domain/models/app-actor';
import type { ValuationActor } from '../../domain/models/valuation-actor';
import { appActorToValuationActor } from '../../domain/identity/app-actor-mapper';

export function authUserToValuationActor(user: AppActor): ValuationActor {
  return appActorToValuationActor(user);
}
