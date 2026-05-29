import Database from 'better-sqlite3';
import type { SqlExecutor } from './sql-executor';

/** Executor SQLite en memoria para tests Jest (Node). */
export function createTestSqlExecutor(): SqlExecutor & { close: () => void } {
  const db = new Database(':memory:');

  const executor: SqlExecutor = {
    async exec(sql: string) {
      db.exec(sql);
    },
    async run(sql: string, params: readonly unknown[] = []) {
      db.prepare(sql).run(...params);
    },
    async getAll<T>(sql: string, params: readonly unknown[] = []) {
      return db.prepare(sql).all(...params) as T[];
    },
    async getFirst<T>(sql: string, params: readonly unknown[] = []) {
      const row = db.prepare(sql).get(...params);
      return row ? (row as T) : null;
    },
    async withTransaction<T>(fn: () => Promise<T>) {
      db.exec('BEGIN');
      try {
        const result = await fn();
        db.exec('COMMIT');
        return result;
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
  };

  return Object.assign(executor, {
    close: () => db.close(),
  });
}
