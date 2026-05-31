import type { UserRole } from '../../domain/models/enums';
import type { Valuation } from '../../domain/models/valuation';
import type { ValuationActor } from '../../domain/models/valuation-actor';
import {
  canSyncMasterConfig as canSyncMasterConfigDomain,
  SYNC_ACCESS_DENIED_MESSAGE,
} from '../../domain/identity/sync-access';
import {
  canDeleteValuation as canDeleteValuationDomain,
  canDuplicateValuation as canDuplicateValuationDomain,
  canEditValuation as canEditValuationDomain,
  canViewValuation as canViewValuationDomain,
} from '../../domain/valuation/valuation-permissions';

export { SYNC_ACCESS_DENIED_MESSAGE };

export function isAdmin(role?: UserRole | string | null): boolean {
  return role === 'admin';
}

export function canManageSettings(role?: UserRole | string | null): boolean {
  return isAdmin(role);
}

export function canSyncMasterConfig(role?: UserRole | string | null): boolean {
  return canSyncMasterConfigDomain(role);
}

export function canViewValuation(actor: ValuationActor, valuation: Valuation): boolean {
  return canViewValuationDomain(actor, valuation);
}

export function canEditValuation(actor: ValuationActor, valuation: Valuation): boolean {
  return canEditValuationDomain(actor, valuation);
}

export function canDeleteValuation(actor: ValuationActor, valuation: Valuation): boolean {
  return canDeleteValuationDomain(actor, valuation);
}

export function canDuplicateValuation(actor: ValuationActor, valuation: Valuation): boolean {
  return canDuplicateValuationDomain(actor, valuation);
}
