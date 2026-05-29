/**
 * Contrato de acceso SQL — implementado por Expo (app) y better-sqlite3 (tests).
 */
export interface SqlExecutor {
  exec(sql: string): Promise<void>;
  run(sql: string, params?: readonly unknown[]): Promise<void>;
  getAll<T>(sql: string, params?: readonly unknown[]): Promise<T[]>;
  getFirst<T>(sql: string, params?: readonly unknown[]): Promise<T | null>;
  withTransaction<T>(fn: () => Promise<T>): Promise<T>;
}
