/**
 * Esquema SQLite MVP — fuente offline principal.
 * snapshot_json en valuations es inmutable por registro guardado.
 */

export const DB_NAME = 'valorizacion_minera.db';
export const SCHEMA_VERSION = 5;

export const CREATE_TABLES_SQL: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY NOT NULL,
    applied_at TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'operador')),
    is_active INTEGER NOT NULL DEFAULT 1,
    display_name TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id),
    token_id TEXT NOT NULL,
    expires_at TEXT,
    created_at TEXT NOT NULL,
    revoked_at TEXT
  );`,

  `CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id),
    device_fingerprint TEXT NOT NULL,
    valid_until TEXT,
    is_blocked INTEGER NOT NULL DEFAULT 0,
    registered_at TEXT NOT NULL,
    UNIQUE(user_id, device_fingerprint)
  );`,

  `CREATE TABLE IF NOT EXISTS material_types (
    id TEXT PRIMARY KEY NOT NULL,
    code TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    metadata_json TEXT
  );`,

  `CREATE TABLE IF NOT EXISTS maquila_ranges (
    id TEXT PRIMARY KEY NOT NULL,
    min_ley_oz_tc TEXT NOT NULL,
    max_ley_oz_tc TEXT NOT NULL,
    maquila TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1
  );`,

  `CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1
  );`,

  `CREATE TABLE IF NOT EXISTS provider_defaults (
    provider_id TEXT PRIMARY KEY NOT NULL REFERENCES providers(id),
    rec_percent_gold TEXT,
    rec_percent_silver TEXT,
    rc_gold TEXT,
    rc_silver TEXT,
    consumos TEXT,
    flete TEXT,
    inter_gold TEXT,
    inter_silver TEXT,
    factor TEXT
  );`,

  `CREATE TABLE IF NOT EXISTS app_settings (
    id TEXT PRIMARY KEY NOT NULL DEFAULT 'default',
    factor TEXT NOT NULL,
    default_consumos TEXT,
    default_flete TEXT,
    default_rc_gold TEXT,
    default_rc_silver TEXT,
    default_rec_percent_gold TEXT,
    default_rec_percent_silver TEXT,
    default_inter_gold TEXT,
    default_inter_silver TEXT,
    inter_gold_source TEXT,
    inter_silver_source TEXT,
    inter_gold_fetched_at TEXT,
    inter_silver_fetched_at TEXT,
    inter_fetch_status TEXT,
    inter_fetch_error TEXT,
    updated_at TEXT NOT NULL
  );`,

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
    raw_checksum TEXT,
    bundle_version TEXT,
    validation_issues_json TEXT
  );`,

  `CREATE TABLE IF NOT EXISTS valuations (
    id TEXT PRIMARY KEY NOT NULL,
    code TEXT NOT NULL UNIQUE,
    material_type_code TEXT NOT NULL,
    provider_id TEXT REFERENCES providers(id),
    provider_name TEXT,
    fecha TEXT NOT NULL,
    observaciones TEXT,
    formula_version TEXT NOT NULL,
    snapshot_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    created_by_user_id TEXT NOT NULL REFERENCES users(id),
    sync_status TEXT NOT NULL DEFAULT 'local'
  );`,

  `CREATE TABLE IF NOT EXISTS valuation_drafts (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    draft_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    payload_json TEXT,
    created_at TEXT NOT NULL,
    user_id TEXT
  );`,

  `CREATE INDEX IF NOT EXISTS idx_valuations_code ON valuations(code);`,
  `CREATE INDEX IF NOT EXISTS idx_valuations_fecha ON valuations(fecha);`,
  `CREATE INDEX IF NOT EXISTS idx_valuations_material ON valuations(material_type_code);`,
  `CREATE INDEX IF NOT EXISTS idx_valuations_provider_name ON valuations(provider_name);`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);`,
];

export const SEED_MATERIAL_TYPES_SQL: readonly string[] = [
  `INSERT OR IGNORE INTO material_types (id, code, label, is_active, sort_order)
   VALUES ('mat-msc', 'MSC', 'MSC', 1, 1);`,
  `INSERT OR IGNORE INTO material_types (id, code, label, is_active, sort_order)
   VALUES ('mat-moc', 'MOC', 'MOC', 1, 2);`,
  `INSERT OR IGNORE INTO material_types (id, code, label, is_active, sort_order)
   VALUES ('mat-msll', 'MSLL', 'MSLL', 1, 3);`,
  `INSERT OR IGNORE INTO material_types (id, code, label, is_active, sort_order)
   VALUES ('mat-moll', 'MOLL', 'MOLL', 1, 4);`,
];
