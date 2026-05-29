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
});
