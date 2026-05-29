import {
  VALUATION_PERMISSION_MESSAGES,
  canDeleteValuation,
  canDuplicateValuation,
  canEditValuation,
} from '../../domain/valuation/valuation-permissions';
import type { ValuationActor } from '../../domain/models/valuation-actor';
import type {
  ValuationInsert,
  ValuationRepository,
  ValuationSearchFilters,
  ValuationUpdate,
} from '../../data/repositories/valuation-repository';

export function createValuationAppService(repository: ValuationRepository) {
  return {
    search: (filters: ValuationSearchFilters) => repository.search(filters),
    findById: (id: string) => repository.findById(id),
    findByCode: (code: string) => repository.findByCode(code),

    async insert(actor: ValuationActor, row: Omit<ValuationInsert, 'createdByUserId' | 'createdByUsername' | 'updatedByUserId' | 'updatedByUsername'>) {
      await repository.insert({
        ...row,
        createdByUserId: actor.id,
        createdByUsername: actor.username,
        updatedByUserId: actor.id,
        updatedByUsername: actor.username,
      });
    },

    async update(
      actor: ValuationActor,
      id: string,
      data: Omit<ValuationUpdate, 'updatedByUserId' | 'updatedByUsername'>
    ) {
      const existing = await repository.findById(id);
      if (!existing) {
        throw new Error('Valorización no encontrada');
      }
      if (!canEditValuation(actor, existing)) {
        throw new Error(VALUATION_PERMISSION_MESSAGES.editDenied);
      }
      await repository.update(id, {
        ...data,
        updatedByUserId: actor.id,
        updatedByUsername: actor.username,
      });
    },

    async delete(actor: ValuationActor, id: string) {
      const existing = await repository.findById(id);
      if (!existing) {
        throw new Error('Valorización no encontrada');
      }
      if (!canDeleteValuation(actor, existing)) {
        throw new Error(VALUATION_PERMISSION_MESSAGES.deleteDenied);
      }
      await repository.delete(id, actor.id);
    },

    async duplicate(actor: ValuationActor, sourceId: string, newCode: string) {
      const source = await repository.findById(sourceId);
      if (!source) {
        throw new Error('Valorización no encontrada');
      }
      if (!canDuplicateValuation(actor, source)) {
        throw new Error(VALUATION_PERMISSION_MESSAGES.editDenied);
      }
      return repository.duplicate(sourceId, newCode, actor);
    },
  };
}
