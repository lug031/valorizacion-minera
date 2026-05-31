import { createTestSqlExecutor } from '../../src/data/db/test-sql-executor';
import { runMigrations } from '../../src/data/db/migrations';
import { createSqliteUserRepository } from '../../src/data/repositories/sqlite-user-repository';
import { createSqliteConfigRepository } from '../../src/data/repositories/sqlite-config-repository';
import { COTIZADOR_DEFAULTS } from '../../src/domain/constants/cotizador-defaults';

describe('migrations and seed', () => {
  const db = createTestSqlExecutor();
  const getDb = async () => db;

  beforeAll(async () => {
    await runMigrations(db);
  });

  afterAll(() => {
    db.close();
  });

  it('crea usuarios con hash (no texto plano)', async () => {
    const users = createSqliteUserRepository(getDb);
    const admin = await users.findByUsername('admin');
    expect(admin).not.toBeNull();
    expect(admin!.passwordHash).toContain('vm-sha256:');
    expect(admin!.passwordHash).not.toBe('admin123');
  });

  it('verifica credenciales admin', async () => {
    const users = createSqliteUserRepository(getDb);
    const ok = await users.verifyCredentials('admin', 'admin123');
    expect(ok?.username).toBe('admin');
  });

  it('seed tipos MAT y maquila', async () => {
    const config = createSqliteConfigRepository(getDb);
    const mats = await config.getMaterialTypes();
    const ranges = await config.getMaquilaRanges();
    expect(mats.length).toBeGreaterThanOrEqual(4);
    expect(mats.some((m) => m.code === 'MOP')).toBe(false);
    expect(ranges.length).toBeGreaterThanOrEqual(18);
  });

  it('seed app_settings', async () => {
    const config = createSqliteConfigRepository(getDb);
    const settings = await config.getAppSettings();
    expect(settings?.factor).toBe(COTIZADOR_DEFAULTS.factor);
    expect(settings?.defaultRecPercentGold).toBe(COTIZADOR_DEFAULTS.recPercentGold);
    expect(settings?.defaultConsumos).toBe(COTIZADOR_DEFAULTS.consumos);
  });

  it('migración v6 agrega columnas de identidad en users', async () => {
    const version = await db.getFirst<{ version: number }>(
      'SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1'
    );
    expect(version?.version).toBeGreaterThanOrEqual(6);

    const columns = await db.getAll<{ name: string }>('PRAGMA table_info(users)');
    const names = columns.map((c) => c.name);
    expect(names).toContain('cloud_user_id');
    expect(names).toContain('auth_mode');
    expect(names).toContain('provisioned_at');

    const users = createSqliteUserRepository(getDb);
    const admin = await users.findByUsername('admin');
    expect(admin?.authSource).toBe('local_seed');
    expect(admin?.cloudUserId).toBeNull();
  });

  it('migración v5 agrega columnas metadata INTER en app_settings', async () => {
    const version = await db.getFirst<{ version: number }>(
      'SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1'
    );
    expect(version?.version).toBeGreaterThanOrEqual(5);

    const columns = await db.getAll<{ name: string }>('PRAGMA table_info(app_settings)');
    const names = columns.map((c) => c.name);
    expect(names).toContain('inter_gold_source');
    expect(names).toContain('inter_fetch_status');
  });

  it('persiste metadata INTER en app_settings', async () => {
    const config = createSqliteConfigRepository(getDb);
    await config.saveAppSettings({
      id: 'default',
      factor: COTIZADOR_DEFAULTS.factor,
      defaultInterGold: '4500.00',
      defaultInterSilver: '75.00',
      interGoldSource: 'minted-metal-lbma',
      interSilverSource: 'minted-metal-lbma',
      interGoldFetchedAt: '2026-05-28T12:00:00.000Z',
      interSilverFetchedAt: '2026-05-28T12:00:00.000Z',
      interFetchStatus: 'ok',
      interFetchError: null,
      updatedAt: new Date().toISOString(),
    });
    const row = await config.getAppSettings();
    expect(row?.interGoldSource).toBe('minted-metal-lbma');
    expect(row?.interFetchStatus).toBe('ok');
    expect(row?.defaultInterGold).toBe('4500.00');
  });
});
