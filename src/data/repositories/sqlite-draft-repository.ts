import type { ValuationDraft } from '../../domain/models/draft';
import { normalizeValuationDraft } from '../../domain/models/draft';
import type { SqlExecutor } from '../db/sql-executor';

export interface DraftRepository {
  save(userId: string, draft: ValuationDraft): Promise<void>;
  load(userId: string): Promise<ValuationDraft | null>;
  clear(userId: string): Promise<void>;
}

export function createSqliteDraftRepository(getDb: () => Promise<SqlExecutor>): DraftRepository {
  return {
    async save(userId, draft) {
      const db = await getDb();
      const id = `draft-${userId}`;
      await db.run(
        `INSERT OR REPLACE INTO valuation_drafts (id, user_id, draft_json, updated_at)
         VALUES (?, ?, ?, datetime('now'))`,
        [id, userId, JSON.stringify(draft)]
      );
    },

    async load(userId) {
      const db = await getDb();
      const row = await db.getFirst<{ draft_json: string }>(
        'SELECT draft_json FROM valuation_drafts WHERE user_id = ?',
        [userId]
      );
      if (!row) return null;
      return normalizeValuationDraft(JSON.parse(row.draft_json) as ValuationDraft);
    },

    async clear(userId) {
      const db = await getDb();
      await db.run('DELETE FROM valuation_drafts WHERE user_id = ?', [userId]);
    },
  };
}
