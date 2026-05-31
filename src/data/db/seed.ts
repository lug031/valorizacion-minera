import type { SqlExecutor } from './sql-executor';
import { COTIZADOR_DEFAULTS } from '../../domain/constants/cotizador-defaults';
import { DEFAULT_MAQUILA_RANGES } from '../../domain/constants/default-maquila-ranges';
import { hashPassword } from '../security/password-hash';

const NOW = () => new Date().toISOString();

export async function seedDatabase(db: SqlExecutor): Promise<void> {
  await seedUsers(db);
  await seedAppSettings(db);
  await seedProviders(db);
}

async function seedUsers(db: SqlExecutor): Promise<void> {
  const users = [
    {
      id: 'u-admin',
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      displayName: 'Administrador',
    },
    {
      id: 'u-operador',
      username: 'operador',
      password: 'operador123',
      role: 'operador',
      displayName: 'Operador Campo',
    },
  ];

  for (const u of users) {
    const existing = await db.getFirst<{ id: string }>(
      'SELECT id FROM users WHERE username = ?',
      [u.username]
    );
    if (existing) continue;

    const ts = NOW();
    await db.run(
      `INSERT INTO users (
         id, username, password_hash, role, is_active, display_name,
         cloud_user_id, auth_mode, provisioned_at, created_at, updated_at
       )
       VALUES (?, ?, ?, ?, 1, ?, NULL, 'local_seed', NULL, ?, ?)`,
      [u.id, u.username, await hashPassword(u.password), u.role, u.displayName, ts, ts]
    );
  }
}

async function seedAppSettings(db: SqlExecutor): Promise<void> {
  const row = await db.getFirst<{ id: string }>(
    "SELECT id FROM app_settings WHERE id = 'default'"
  );
  if (row) return;

  await db.run(
    `INSERT INTO app_settings (
      id, factor, default_consumos, default_flete, default_rc_gold, default_rc_silver,
      default_rec_percent_gold, default_rec_percent_silver, default_inter_gold, default_inter_silver, updated_at
    ) VALUES ('default', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      COTIZADOR_DEFAULTS.factor,
      COTIZADOR_DEFAULTS.consumos,
      COTIZADOR_DEFAULTS.flete,
      COTIZADOR_DEFAULTS.rcGold,
      COTIZADOR_DEFAULTS.rcSilver,
      COTIZADOR_DEFAULTS.recPercentGold,
      COTIZADOR_DEFAULTS.recPercentSilver,
      COTIZADOR_DEFAULTS.interGold,
      COTIZADOR_DEFAULTS.interSilver,
      NOW(),
    ]
  );
}

async function seedProviders(db: SqlExecutor): Promise<void> {
  const existing = await db.getFirst<{ id: string }>(
    "SELECT id FROM providers WHERE id = 'p-demo'"
  );
  if (existing) return;

  await db.run(`INSERT INTO providers (id, name, is_active) VALUES ('p-demo', 'Proveedor Demo', 1)`);
  await db.run(
    `INSERT INTO provider_defaults (
      provider_id, rec_percent_gold, rec_percent_silver, rc_gold, rc_silver,
      consumos, flete, inter_gold, inter_silver, factor
    ) VALUES ('p-demo', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      COTIZADOR_DEFAULTS.recPercentGold,
      COTIZADOR_DEFAULTS.recPercentSilver,
      COTIZADOR_DEFAULTS.rcGold,
      COTIZADOR_DEFAULTS.rcSilver,
      COTIZADOR_DEFAULTS.consumos,
      COTIZADOR_DEFAULTS.flete,
      COTIZADOR_DEFAULTS.interGold,
      COTIZADOR_DEFAULTS.interSilver,
      COTIZADOR_DEFAULTS.factor,
    ]
  );
}

export async function seedMaquilaRanges(db: SqlExecutor): Promise<void> {
  let order = 0;
  for (const range of DEFAULT_MAQUILA_RANGES) {
    const id = `maquila-${order}`;
    await db.run(
      `INSERT OR IGNORE INTO maquila_ranges (id, min_ley_oz_tc, max_ley_oz_tc, maquila, sort_order, is_active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [id, range.minLeyOzTc, range.maxLeyOzTc, range.maquila, order]
    );
    order += 1;
  }
}
