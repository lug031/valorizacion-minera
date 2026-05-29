import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { DB_NAME } from './schema';
import { createExpoSqlExecutor } from './expo-sql-executor';
import type { SqlExecutor } from './sql-executor';
import { runMigrations } from './migrations';

let dbInstance: SQLiteDatabase | null = null;
let executor: SqlExecutor | null = null;
let initPromise: Promise<SqlExecutor> | null = null;

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await openDatabaseAsync(DB_NAME);
  }
  return dbInstance;
}

export async function getSqlExecutor(): Promise<SqlExecutor> {
  if (executor) return executor;
  if (!initPromise) {
    initPromise = (async () => {
      const db = await getDatabase();
      const exec = createExpoSqlExecutor(db);
      await runMigrations(exec);
      executor = exec;
      return exec;
    })();
  }
  return initPromise;
}

export async function resetDatabaseForTests(): Promise<void> {
  dbInstance = null;
  executor = null;
  initPromise = null;
}
