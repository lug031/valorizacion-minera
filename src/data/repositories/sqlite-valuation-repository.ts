import * as Crypto from 'expo-crypto';
import type { Valuation, ValuationListItem } from '../../domain/models/valuation';
import { formatOwnershipUsername } from '../../domain/constants/valuation-ownership';
import type { SqlExecutor } from '../db/sql-executor';
import { writeAuditLog } from '../services/audit-log';
import {
  parseSnapshot,
  serializeSnapshot,
  type ValuationPushRow,
  type ValuationRepository,
} from './valuation-repository';

interface ValuationRow {
  id: string;
  code: string;
  material_type_code: string;
  provider_id: string | null;
  provider_name: string | null;
  fecha: string;
  observaciones: string | null;
  formula_version: string;
  snapshot_json: string;
  created_at: string;
  updated_at: string;
  created_by_user_id: string;
  created_by_username: string | null;
  updated_by_user_id: string | null;
  updated_by_username: string | null;
  sync_status: string;
  cloud_valuation_id: string | null;
  sync_error: string | null;
  sync_attempted_at: string | null;
  last_synced_at: string | null;
}

function mapValuation(row: ValuationRow): Valuation {
  return {
    id: row.id,
    code: row.code,
    materialTypeCode: row.material_type_code,
    providerId: row.provider_id,
    providerName: row.provider_name,
    fecha: row.fecha,
    observaciones: row.observaciones,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdByUserId: row.created_by_user_id,
    createdByUsername: formatOwnershipUsername(row.created_by_username),
    updatedByUserId: row.updated_by_user_id ?? row.created_by_user_id,
    updatedByUsername: formatOwnershipUsername(
      row.updated_by_username ?? row.created_by_username
    ),
    snapshotJson: row.snapshot_json,
  };
}

function toListItem(row: ValuationRow): ValuationListItem {
  const snap = parseSnapshot(row.snapshot_json);
  const first = snap.results.scenarios[0];
  return {
    id: row.id,
    code: row.code,
    fecha: row.fecha,
    materialTypeCode: row.material_type_code,
    providerName: row.provider_name,
    valorCompraTotalScenarioA: first?.valorCompraTotal ?? null,
    tms: snap.results.tms,
    createdAt: row.created_at,
    createdByUsername: formatOwnershipUsername(row.created_by_username),
    updatedByUsername: formatOwnershipUsername(
      row.updated_by_username ?? row.created_by_username
    ),
  };
}

export function createSqliteValuationRepository(
  getDb: () => Promise<SqlExecutor>
): ValuationRepository {
  return {
    async insert(row) {
      const existing = await this.findByCode(row.code);
      if (existing) {
        throw new Error('Ya existe una cotización con ese código');
      }

      const db = await getDb();
      await db.run(
        `INSERT INTO valuations (
          id, code, material_type_code, provider_id, provider_name, fecha, observaciones,
          formula_version, snapshot_json, created_at, updated_at,
          created_by_user_id, created_by_username, updated_by_user_id, updated_by_username,
          sync_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          row.id,
          row.code,
          row.materialTypeCode,
          row.providerId,
          row.providerName,
          row.fecha,
          row.observaciones,
          row.formulaVersion,
          serializeSnapshot(row.snapshot),
          row.createdAt,
          row.updatedAt,
          row.createdByUserId,
          row.createdByUsername,
          row.updatedByUserId,
          row.updatedByUsername,
        ]
      );
      await writeAuditLog(db, {
        entityType: 'valuation',
        entityId: row.id,
        action: 'create',
        userId: row.createdByUserId,
        payload: { code: row.code },
      });
    },

    async findById(id) {
      const db = await getDb();
      const row = await db.getFirst<ValuationRow>(
        'SELECT * FROM valuations WHERE id = ?',
        [id]
      );
      return row ? mapValuation(row) : null;
    },

    async findByCode(code) {
      const db = await getDb();
      const row = await db.getFirst<ValuationRow>(
        'SELECT * FROM valuations WHERE code = ?',
        [code]
      );
      return row ? mapValuation(row) : null;
    },

    async search(filters) {
      const db = await getDb();
      const clauses: string[] = [];
      const params: unknown[] = [];

      if (filters.code) {
        clauses.push('code LIKE ?');
        params.push(`%${filters.code}%`);
      }
      if (filters.materialTypeCode) {
        clauses.push('material_type_code = ?');
        params.push(filters.materialTypeCode);
      }
      if (filters.providerName) {
        clauses.push('provider_name LIKE ?');
        params.push(`%${filters.providerName}%`);
      }
      if (filters.fechaFrom) {
        clauses.push('date(created_at) >= date(?)');
        params.push(filters.fechaFrom);
      }
      if (filters.fechaTo) {
        clauses.push('date(created_at) <= date(?)');
        params.push(filters.fechaTo);
      }

      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
      const rows = await db.getAll<ValuationRow>(
        `SELECT * FROM valuations ${where} ORDER BY created_at DESC`,
        params
      );
      return rows.map(toListItem);
    },

    async update(id, data) {
      const db = await getDb();
      const existing = await this.findById(id);
      if (!existing) throw new Error('Valorización no encontrada');

      const codeOwner = await this.findByCode(data.code);
      if (codeOwner && codeOwner.id !== id) {
        throw new Error('Ya existe otra cotización con ese código');
      }

      await db.run(
        `UPDATE valuations SET
          code = ?,
          material_type_code = ?,
          provider_id = ?,
          provider_name = ?,
          fecha = ?,
          observaciones = ?,
          snapshot_json = ?,
          updated_at = ?,
          formula_version = ?,
          updated_by_user_id = ?,
          updated_by_username = ?
        WHERE id = ?`,
        [
          data.code,
          data.materialTypeCode,
          data.providerId,
          data.providerName,
          data.fecha,
          data.observaciones,
          serializeSnapshot(data.snapshot),
          data.updatedAt,
          data.snapshot.formulaVersion,
          data.updatedByUserId,
          data.updatedByUsername,
          id,
        ]
      );
      await writeAuditLog(db, {
        entityType: 'valuation',
        entityId: id,
        action: 'update',
        userId: data.updatedByUserId,
        payload: { code: data.code },
      });
    },

    async delete(id, actorUserId) {
      const db = await getDb();
      await db.run('DELETE FROM valuations WHERE id = ?', [id]);
      await writeAuditLog(db, {
        entityType: 'valuation',
        entityId: id,
        action: 'delete',
        userId: actorUserId,
      });
    },

    async duplicate(sourceId, newCode, actor) {
      const db = await getDb();
      const source = await this.findById(sourceId);
      if (!source) throw new Error('Valorización no encontrada');

      const snapshot = parseSnapshot(source.snapshotJson);
      const now = new Date().toISOString();
      const newId = `val-${Crypto.randomUUID()}`;

      await this.insert({
        id: newId,
        code: newCode,
        materialTypeCode: source.materialTypeCode,
        providerId: source.providerId,
        providerName: source.providerName,
        fecha: source.fecha,
        observaciones: source.observaciones,
        formulaVersion: snapshot.formulaVersion,
        snapshot,
        createdByUserId: actor.id,
        createdByUsername: actor.username,
        updatedByUserId: actor.id,
        updatedByUsername: actor.username,
        createdAt: now,
        updatedAt: now,
      });

      await writeAuditLog(db, {
        entityType: 'valuation',
        entityId: newId,
        action: 'duplicate',
        userId: actor.id,
        payload: { sourceId },
      });

      return newId;
    },

    async listPendingForSync() {
      const db = await getDb();
      const rows = await db.getAll<
        ValuationRow & { cloud_user_id: string | null }
      >(
        `SELECT v.*, u.cloud_user_id
         FROM valuations v
         INNER JOIN users u ON u.id = v.created_by_user_id
         WHERE v.sync_status IN ('pending', 'error')
         ORDER BY v.created_at ASC`
      );
      return rows.map(
        (row): ValuationPushRow => ({
          id: row.id,
          code: row.code,
          materialTypeCode: row.material_type_code,
          providerName: row.provider_name,
          fecha: row.fecha,
          observaciones: row.observaciones,
          formulaVersion: row.formula_version,
          snapshotJson: row.snapshot_json,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          createdByUserId: row.created_by_user_id,
          createdByUsername: formatOwnershipUsername(row.created_by_username),
          cloudUserId: row.cloud_user_id,
          syncStatus: row.sync_status,
          cloudValuationId: row.cloud_valuation_id,
        })
      );
    },

    async markSyncing(id) {
      const db = await getDb();
      await db.run(
        `UPDATE valuations SET sync_status = 'syncing', sync_attempted_at = datetime('now') WHERE id = ?`,
        [id]
      );
    },

    async markSynced(id, cloudValuationId) {
      const db = await getDb();
      await db.run(
        `UPDATE valuations SET
           sync_status = 'synced',
           cloud_valuation_id = ?,
           sync_error = NULL,
           last_synced_at = datetime('now')
         WHERE id = ?`,
        [cloudValuationId, id]
      );
    },

    async markSyncError(id, message) {
      const db = await getDb();
      await db.run(
        `UPDATE valuations SET sync_status = 'error', sync_error = ?, sync_attempted_at = datetime('now') WHERE id = ?`,
        [message.slice(0, 500), id]
      );
    },

    async getSyncStatus(id) {
      const db = await getDb();
      const row = await db.getFirst<{ sync_status: string }>(
        'SELECT sync_status FROM valuations WHERE id = ?',
        [id]
      );
      return row?.sync_status ?? null;
    },
  };
}
