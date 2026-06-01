import type { Valuation, ValuationListItem } from '../../domain/models/valuation';
import type {
  ValuationInsert,
  ValuationRepository,
  ValuationSearchFilters,
  ValuationUpdate,
} from './valuation-repository';
import { parseSnapshot, serializeSnapshot } from './valuation-repository';

const memory: Valuation[] = [];

export const fakeValuationRepository: ValuationRepository = {
  async insert(row: ValuationInsert) {
    const existing = memory.find((v) => v.code === row.code);
    if (existing) {
      throw new Error('Ya existe una cotización con ese código');
    }
    memory.unshift({
      id: row.id,
      code: row.code,
      materialTypeCode: row.materialTypeCode,
      providerId: row.providerId,
      providerName: row.providerName,
      fecha: row.fecha,
      observaciones: row.observaciones,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      createdByUserId: row.createdByUserId,
      createdByUsername: row.createdByUsername,
      updatedByUserId: row.updatedByUserId,
      updatedByUsername: row.updatedByUsername,
      snapshotJson: serializeSnapshot(row.snapshot),
      syncStatus: 'pending',
      syncError: null,
    });
  },

  async findById(id) {
    return memory.find((v) => v.id === id) ?? null;
  },

  async findByCode(code) {
    return memory.find((v) => v.code === code) ?? null;
  },

  async search(filters: ValuationSearchFilters) {
    let list = [...memory];
    if (filters.code) {
      const q = filters.code.toLowerCase();
      list = list.filter((v) => v.code.toLowerCase().includes(q));
    }
    if (filters.materialTypeCode) {
      list = list.filter((v) => v.materialTypeCode === filters.materialTypeCode);
    }
    if (filters.providerName) {
      const q = filters.providerName.toLowerCase();
      list = list.filter((v) => (v.providerName ?? '').toLowerCase().includes(q));
    }
    return list.map((v): ValuationListItem => {
      const snap = parseSnapshot(v.snapshotJson);
      const first = snap.results.scenarios[0];
      return {
        id: v.id,
        code: v.code,
        fecha: v.fecha,
        materialTypeCode: v.materialTypeCode,
        providerName: v.providerName,
        valorCompraTotalScenarioA: first?.valorCompraTotal ?? null,
        tms: snap.results.tms,
        createdAt: v.createdAt,
        syncStatus: v.syncStatus,
        syncError: v.syncError,
      };
    });
  },

  async update(id, data: ValuationUpdate) {
    const idx = memory.findIndex((v) => v.id === id);
    if (idx < 0) throw new Error('Valorización no encontrada');
    const codeOwner = memory.find((v) => v.code === data.code);
    if (codeOwner && codeOwner.id !== id) {
      throw new Error('Ya existe otra cotización con ese código');
    }
    memory[idx] = {
      ...memory[idx],
      code: data.code,
      materialTypeCode: data.materialTypeCode,
      providerId: data.providerId,
      providerName: data.providerName,
      fecha: data.fecha,
      observaciones: data.observaciones,
      snapshotJson: serializeSnapshot(data.snapshot),
      updatedAt: data.updatedAt,
      updatedByUserId: data.updatedByUserId,
      updatedByUsername: data.updatedByUsername,
    };
  },

  async delete(id, _actorUserId) {
    const idx = memory.findIndex((v) => v.id === id);
    if (idx >= 0) memory.splice(idx, 1);
  },

  async duplicate(sourceId, newCode, actor) {
    const source = memory.find((v) => v.id === sourceId);
    if (!source) throw new Error('Valorización no encontrada');
    const newId = `val-${Date.now()}`;
    const now = new Date().toISOString();
    memory.unshift({
      ...source,
      id: newId,
      code: newCode,
      createdByUserId: actor.id,
      createdByUsername: actor.username,
      updatedByUserId: actor.id,
      updatedByUsername: actor.username,
      createdAt: now,
      updatedAt: now,
      syncStatus: 'pending',
      syncError: null,
    });
    return newId;
  },

  async listPendingForSync() {
    return [];
  },

  async markSyncing(_id) {},

  async markSynced(_id, _cloudValuationId) {},

  async markSyncError(_id, _message) {},

  async getSyncStatus(_id) {
    return null;
  },

  async countOutbox() {
    return { pending: 0, error: 0 };
  },
};
