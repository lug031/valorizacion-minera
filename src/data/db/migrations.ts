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

  if (currentVersion < 5) {
    await db.withTransaction(async () => {
      await addColumnIfMissing(db, 'app_settings', 'inter_gold_source', 'TEXT');
      await addColumnIfMissing(db, 'app_settings', 'inter_silver_source', 'TEXT');
      await addColumnIfMissing(db, 'app_settings', 'inter_gold_fetched_at', 'TEXT');
      await addColumnIfMissing(db, 'app_settings', 'inter_silver_fetched_at', 'TEXT');
      await addColumnIfMissing(db, 'app_settings', 'inter_fetch_status', 'TEXT');
      await addColumnIfMissing(db, 'app_settings', 'inter_fetch_error', 'TEXT');

      await db.run(
        `INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (?, datetime('now'))`,
        [5]
      );
    });
  }

  if (currentVersion < 6) {
    await db.withTransaction(async () => {
      await addColumnIfMissing(db, 'users', 'cloud_user_id', 'TEXT');
      await addColumnIfMissing(
        db,
        'users',
        'auth_mode',
        "TEXT NOT NULL DEFAULT 'local_seed'"
      );
      await addColumnIfMissing(db, 'users', 'provisioned_at', 'TEXT');

      await db.run(
        `UPDATE users SET auth_mode = 'local_seed'
         WHERE auth_mode IS NULL OR trim(auth_mode) = ''`
      );

      await db.run(
        `INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (?, datetime('now'))`,
        [6]
      );
    });
  }

  if (currentVersion < 7) {
    await db.withTransaction(async () => {
      await addColumnIfMissing(db, 'devices', 'cloud_device_id', 'TEXT');
      await addColumnIfMissing(db, 'devices', 'last_sync_at', 'TEXT');
      await addColumnIfMissing(db, 'devices', 'platform', 'TEXT');
      await addColumnIfMissing(db, 'devices', 'app_version', 'TEXT');
      await addColumnIfMissing(
        db,
        'devices',
        'enrollment_status',
        "TEXT NOT NULL DEFAULT 'local'"
      );
      await addColumnIfMissing(db, 'devices', 'notes', 'TEXT');
      await addColumnIfMissing(db, 'devices', 'metadata_json', 'TEXT');

      await db.run(
        `UPDATE devices SET enrollment_status = 'local'
         WHERE enrollment_status IS NULL OR trim(enrollment_status) = ''`
      );

      await db.run(
        `INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (?, datetime('now'))`,
        [7]
      );
    });
  }

  if (currentVersion < 8) {
    await db.withTransaction(async () => {
      await addColumnIfMissing(db, 'devices', 'grace_days_offline', 'INTEGER');

      await db.run(
        `INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (?, datetime('now'))`,
        [8]
      );
    });
  }

  if (currentVersion < 9) {
    await db.withTransaction(async () => {
      await addColumnIfMissing(db, 'valuations', 'cloud_valuation_id', 'TEXT');
      await addColumnIfMissing(db, 'valuations', 'sync_error', 'TEXT');
      await addColumnIfMissing(db, 'valuations', 'sync_attempted_at', 'TEXT');
      await addColumnIfMissing(db, 'valuations', 'last_synced_at', 'TEXT');

      await db.run(
        `UPDATE valuations SET sync_status = 'pending'
         WHERE sync_status = 'local' OR sync_status IS NULL OR trim(sync_status) = ''`
      );

      await db.run(
        `INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (?, datetime('now'))`,
        [9]
      );
    });
  }

  if (currentVersion < 10) {
    await db.withTransaction(async () => {
      await addColumnIfMissing(db, 'sync_metadata', 'config_changelog_json', 'TEXT');

      await db.run(
        `INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (?, datetime('now'))`,
        [10]
      );
    });
  }

  if (currentVersion < 11) {
    await db.withTransaction(async () => {
      await addColumnIfMissing(db, 'material_types', 'updated_at', 'TEXT');
      await addColumnIfMissing(db, 'maquila_ranges', 'updated_at', 'TEXT');

      await db.run(
        `INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (?, datetime('now'))`,
        [11]
      );
    });
  }

  if (currentVersion < 12) {
    await db.withTransaction(async () => {
      await addColumnIfMissing(db, 'devices', 'usage_policy', "TEXT NOT NULL DEFAULT 'standard'");
      await addColumnIfMissing(db, 'devices', 'trial_limit_minutes', 'INTEGER');
      await addColumnIfMissing(db, 'devices', 'usage_quota_reset_at', 'TEXT');
      await addColumnIfMissing(db, 'devices', 'usage_accumulated_ms', 'INTEGER NOT NULL DEFAULT 0');

      await db.run(
        `INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (?, datetime('now'))`,
        [12]
      );
    });
  }

  if (currentVersion < 13) {
    await db.withTransaction(async () => {
      await addColumnIfMissing(db, 'devices', 'usage_quota_reset_applied_at', 'TEXT');
      await db.run(
        `UPDATE devices SET usage_quota_reset_applied_at = usage_quota_reset_at
         WHERE usage_quota_reset_at IS NOT NULL
           AND COALESCE(usage_accumulated_ms, 0) > 0`
      );

      await db.run(
        `INSERT OR REPLACE INTO schema_migrations (version, applied_at) VALUES (?, datetime('now'))`,
        [13]
      );
    });
  }
}
