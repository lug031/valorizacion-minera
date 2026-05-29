import type { ValuationActor } from '../models/valuation-actor';
import type { Valuation } from '../models/valuation';

export const VALUATION_PERMISSION_MESSAGES = {
  editDenied: 'No tiene permiso para editar esta cotización.',
  deleteDenied: 'No tiene permiso para eliminar cotizaciones.',
  sessionRequired: 'Debe iniciar sesión para guardar la cotización.',
} as const;

function isAdmin(actor: ValuationActor): boolean {
  return actor.role === 'admin';
}

function isOwner(actor: ValuationActor, valuation: Valuation): boolean {
  return valuation.createdByUserId === actor.id;
}

/** Todos los roles autenticados pueden ver el historial completo. */
export function canViewValuation(_actor: ValuationActor, _valuation: Valuation): boolean {
  return true;
}

export function canEditValuation(actor: ValuationActor, valuation: Valuation): boolean {
  if (isAdmin(actor)) return true;
  return isOwner(actor, valuation);
}

export function canDeleteValuation(actor: ValuationActor, _valuation: Valuation): boolean {
  return isAdmin(actor);
}

/** Operador y admin pueden duplicar cualquier cotización; la copia queda a nombre del actor. */
export function canDuplicateValuation(_actor: ValuationActor, _valuation: Valuation): boolean {
  return true;
}
