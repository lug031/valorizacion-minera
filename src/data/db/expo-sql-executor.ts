import type { SQLiteDatabase } from 'expo-sqlite';
import type { SqlExecutor } from './sql-executor';

export function createExpoSqlExecutor(db: SQLiteDatabase): SqlExecutor {
  return {
    async exec(sql: string) {
      await db.execAsync(sql);
    },

    async run(sql: string, params: readonly unknown[] = []) {
      await db.runAsync(sql, ...(params as never[]));
    },

    async getAll<T>(sql: string, params: readonly unknown[] = []) {
      return db.getAllAsync<T>(sql, ...(params as never[]));
    },

    async getFirst<T>(sql: string, params: readonly unknown[] = []) {
      const row = await db.getFirstAsync<T>(sql, ...(params as never[]));
      return row ?? null;
    },

    async withTransaction<T>(fn: () => Promise<T>) {
      let result!: T;
      await db.withTransactionAsync(async () => {
        result = await fn();
      });
      return result;
    },
  };
}
