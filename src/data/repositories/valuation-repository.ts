import type { ValuationActor } from '../../domain/models/valuation-actor';
import type { Valuation, ValuationListItem, ValuationSnapshot } from '../../domain/models/valuation';
import type { ValuationSyncQueueCounts } from './valuation-sync-queue';

export type ValuationSyncStatus = 'pending' | 'syncing' | 'synced' | 'error';

export interface ValuationSearchFilters {
  code?: string;
  fechaFrom?: string;
  fechaTo?: string;
  materialTypeCode?: string;
  providerName?: string;
}

export interface ValuationPushRow {
  id: string;
  code: string;
  materialTypeCode: string;
  providerName: string | null;
  fecha: string;
  observaciones: string | null;
  formulaVersion: string;
  snapshotJson: string;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string;
  createdByUsername: string;
  cloudUserId: string | null;
  syncStatus: ValuationSyncStatus | string;
  cloudValuationId: string | null;
}

export interface ValuationInsert {
  id: string;
  code: string;
  materialTypeCode: string;
  providerId: string | null;
  providerName: string | null;
  fecha: string;
  observaciones: string | null;
  formulaVersion: string;
  snapshot: ValuationSnapshot;
  createdByUserId: string;
  createdByUsername: string;
  updatedByUserId: string;
  updatedByUsername: string;
  createdAt: string;
  updatedAt: string;
}

export interface ValuationUpdate {
  snapshot: ValuationSnapshot;
  updatedAt: string;
  code: string;
  materialTypeCode: string;
  providerId: string | null;
  providerName: string | null;
  fecha: string;
  observaciones: string | null;
  updatedByUserId: string;
  updatedByUsername: string;
}

/**
 * Contrato del repositorio — implementación con expo-sqlite en Fase 6.
 */
export interface ValuationRepository {
  insert(row: ValuationInsert): Promise<void>;
  findById(id: string): Promise<Valuation | null>;
  findByCode(code: string): Promise<Valuation | null>;
  search(filters: ValuationSearchFilters): Promise<ValuationListItem[]>;
  update(id: string, data: ValuationUpdate): Promise<void>;
  delete(id: string, actorUserId: string): Promise<void>;
  /** Copia snapshot inmutable con nuevo id/código (nueva valoración). */
  duplicate(sourceId: string, newCode: string, actor: ValuationActor): Promise<string>;
  listPendingForSync(): Promise<ValuationPushRow[]>;
  /**
   * Registros en `syncing` sin proceso activo (p. ej. cierre de app tras markSyncing).
   * Se invoca al inicio de cada envío: vuelven a `pending` para reintento idempotente.
   */
  resetOrphanedSyncing(): Promise<number>;
  markSyncing(id: string): Promise<void>;
  markSynced(id: string, cloudValuationId: string): Promise<void>;
  markSyncError(id: string, message: string): Promise<void>;
  getSyncStatus(id: string): Promise<ValuationSyncStatus | string | null>;
  countSyncQueue(): Promise<ValuationSyncQueueCounts>;
  /** @deprecated Use countSyncQueue */
  countOutbox(): Promise<{ pending: number; error: number }>;
}

export function serializeSnapshot(snapshot: ValuationSnapshot): string {
  return JSON.stringify(snapshot);
}

export function parseSnapshot(json: string): ValuationSnapshot {
  const snapshot = tryParseSnapshot(json);
  if (!snapshot) {
    throw new Error('No se pudo leer la cotización guardada');
  }
  return snapshot;
}

/** Parseo seguro para UI: null si el JSON está corrupto o incompleto. */
export function tryParseSnapshot(json: string): ValuationSnapshot | null {
  try {
    const parsed = JSON.parse(json) as ValuationSnapshot;
    if (!parsed?.results?.scenarios?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}
