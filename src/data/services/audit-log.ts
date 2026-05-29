import type { SqlExecutor } from '../db/sql-executor';

export async function writeAuditLog(
  db: SqlExecutor,
  params: {
    entityType: string;
    entityId: string;
    action: string;
    userId?: string | null;
    payload?: unknown;
  }
): Promise<void> {
  const id = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await db.run(
    `INSERT INTO audit_logs (id, entity_type, entity_id, action, payload_json, created_at, user_id)
     VALUES (?, ?, ?, ?, ?, datetime('now'), ?)`,
    [
      id,
      params.entityType,
      params.entityId,
      params.action,
      params.payload ? JSON.stringify(params.payload) : null,
      params.userId ?? null,
    ]
  );
}
