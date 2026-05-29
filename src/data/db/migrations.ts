import { CREATE_TABLES_SQL, SCHEMA_VERSION, SEED_MATERIAL_TYPES_SQL } from './schema';
import type { SqlExecutor } from './sql-executor';
import { seedDatabase, seedMaquilaRanges } from './seed';

async function addColumnIfMissing(db: SqlExecutor, table: string, column: string, type: string) {
  const columns = await db.getAll<{ name: string }>(`PRAGMA table_info(${table})`);
  if (!columns.some((c) => c.name === column)) {
    await db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  }
}

export async function runMigrations(db: SqlExecutor): Promise<void> {
  for (const sql of CREATE_TABLES_SQL) {
    await db.exec(sql);
  }

  const applied = await db.getFirst<{ version: number }>(
    'SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1'
  );

  if (applied && applied.version >= SCHEMA_VERSION) {
    return;
  }

  const currentVersion = applied?.version ?? 0;

  if (currentVersion < 1) {
    await db.withTransaction(async () => {
      for (const sql of SEED_MATERIAL_TYPES_SQL) {
        await db.exec(sql);
      }
      await seedMaquilaRanges(db);
      await seedDatabase(db);
      await db.run(
        `INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (?, datetime('now'))`,
        [1]
      );
    });
  }

  if (currentVersion < 2) {
    await db.withTransaction(async () => {
      await db.exec(
        `CREATE TABLE IF NOT EXISTS sync_metadata (
          key TEXT PRIMARY KEY NOT NULL,
          last_sync_at TEXT,
          status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'syncing', 'success', 'error', 'offline')),
          error_message TEXT,
          records_material_types INTEGER NOT NULL DEFAULT 0,
          records_maquila_ranges INTEGER NOT NULL DEFAULT 0,
          records_providers INTEGER NOT NULL DEFAULT 0,
          records_provider_defaults INTEGER NOT NULL DEFAULT 0,
          records_app_settings INTEGER NOT NULL DEFAULT 0,
          max_updated_at_material_types TEXT,
          max_updated_at_maquila_ranges TEXT,
          max_updated_at_providers TEXT,
          max_updated_at_provider_defaults TEXT,
          max_updated_at_app_settings TEXT,
          raw_checksum TEXT
        );`
      );
      await db.run(
        `INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (?, datetime('now'))`,
        [2]
      );
    });
  }

  if (currentVersion < 3) {
    await db.withTransaction(async () => {
      await addColumnIfMissing(db, 'sync_metadata', 'bundle_version', 'TEXT');
      await addColumnIfMissing(db, 'sync_metadata', 'validation_issues_json', 'TEXT');
      await db.run(
        `INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (?, datetime('now'))`,
        [3]
      );
    });
  }

  if (currentVersion < 4) {
    await db.withTransaction(async () => {
      await addColumnIfMissing(db, 'valuations', 'created_by_username', 'TEXT');
      await addColumnIfMissing(db, 'valuations', 'updated_by_user_id', 'TEXT');
      await addColumnIfMissing(db, 'valuations', 'updated_by_username', 'TEXT');

      await db.run(
        `UPDATE valuations SET created_by_username = (
           SELECT username FROM users WHERE users.id = valuations.created_by_user_id
         )
         WHERE created_by_username IS NULL OR trim(created_by_username) = ''`
      );
      await db.run(
        `UPDATE valuations SET created_by_username = 'Desconocido'
         WHERE created_by_username IS NULL OR trim(created_by_username) = ''`
      );
      await db.run(
        `UPDATE valuations SET
           updated_by_user_id = created_by_user_id,
           updated_by_username = created_by_username
         WHERE updated_by_user_id IS NULL OR trim(updated_by_user_id) = ''`
      );
      await db.run(
        `UPDATE valuations SET updated_by_username = 'Desconocido'
         WHERE updated_by_username IS NULL OR trim(updated_by_username) = ''`
      );

      await db.run(
        `INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (?, datetime('now'))`,
        [4]
      );
    });
  }
}
