import { createTestSqlExecutor } from '../../src/data/db/test-sql-executor';
import { runMigrations } from '../../src/data/db/migrations';
import { createSqliteUserRepository } from '../../src/data/repositories/sqlite-user-repository';

describe('updateFieldUserFromCloud', () => {
  const db = createTestSqlExecutor();
  const getDb = async () => db;
  const users = createSqliteUserRepository(getDb);

  beforeAll(async () => {
    await runMigrations(db);
  });

  afterAll(() => {
    db.close();
  });

  it('actualiza rol y nombre visible del usuario provisionado', async () => {
    await users.applyEnrolledFieldUser({
      cloudUserId: 'cloud-role-test',
      username: 'lugo',
      displayName: 'Lugo Operador',
      role: 'operador',
      passwordHash: 'vm-sha256:x',
      provisionedAt: '2026-06-03T12:00:00.000Z',
    });

    await users.updateFieldUserFromCloud({
      cloudUserId: 'cloud-role-test',
      role: 'admin',
      displayName: 'Lugo Admin',
    });

    const row = await users.findByUsername('lugo');
    expect(row?.role).toBe('admin');
    expect(row?.displayName).toBe('Lugo Admin');
  });
});
