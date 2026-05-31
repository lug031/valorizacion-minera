import { createTestSqlExecutor } from '../../src/data/db/test-sql-executor';
import { runMigrations } from '../../src/data/db/migrations';
import { createSqliteUserRepository } from '../../src/data/repositories/sqlite-user-repository';

describe('sqlite user provisioned sync', () => {
  const db = createTestSqlExecutor();
  const getDb = async () => db;

  beforeAll(async () => {
    await runMigrations(db);
  });

  afterAll(() => {
    db.close();
  });

  it('inserta usuarios provisionados con cloud_user_id y auth_mode local_provisioned', async () => {
    const users = createSqliteUserRepository(getDb);
    const result = await users.syncProvisionedUsers([
      {
        cloudUserId: 'cloud-001',
        username: 'jperez',
        displayName: 'Juan Pérez',
        role: 'operador',
        isActive: true,
        passwordHash: 'vm-sha256:abc123',
        provisionedAt: '2026-05-27T10:00:00.000Z',
      },
    ]);

    expect(result.upserted).toBe(1);
    const row = await users.findByUsername('jperez');
    expect(row?.authSource).toBe('local_provisioned');
    expect(row?.cloudUserId).toBe('cloud-001');
    expect(row?.id).toBe('f-cloud-001');
  });

  it('actualiza hash y desactiva usuarios ausentes en el payload', async () => {
    const users = createSqliteUserRepository(getDb);
    await users.syncProvisionedUsers([
      {
        cloudUserId: 'cloud-001',
        username: 'jperez',
        displayName: 'Juan Pérez',
        role: 'operador',
        isActive: true,
        passwordHash: 'vm-sha256:newhash',
        provisionedAt: '2026-05-27T11:00:00.000Z',
      },
      {
        cloudUserId: 'cloud-002',
        username: 'mlopez',
        displayName: 'María López',
        role: 'operador',
        isActive: true,
        passwordHash: 'vm-sha256:def456',
        provisionedAt: '2026-05-27T11:00:00.000Z',
      },
    ]);

    await users.syncProvisionedUsers([
      {
        cloudUserId: 'cloud-001',
        username: 'jperez',
        displayName: 'Juan Pérez',
        role: 'operador',
        isActive: false,
        passwordHash: 'vm-sha256:newhash',
        provisionedAt: '2026-05-27T12:00:00.000Z',
      },
    ]);

    const active = await users.findByUsername('jperez');
    const deactivated = await users.findByUsername('mlopez');
    expect(active?.isActive).toBe(false);
    expect(deactivated?.isActive).toBe(false);
  });

  it('omite username que colisiona con usuario seed local', async () => {
    const users = createSqliteUserRepository(getDb);
    const result = await users.syncProvisionedUsers([
      {
        cloudUserId: 'cloud-admin',
        username: 'admin',
        displayName: 'Admin Cloud',
        role: 'admin',
        isActive: true,
        passwordHash: 'vm-sha256:cloudadmin',
        provisionedAt: '2026-05-27T12:00:00.000Z',
      },
    ]);

    expect(result.skippedSeedConflicts).toBe(1);
    const seedAdmin = await users.findByUsername('admin');
    expect(seedAdmin?.authSource).toBe('local_seed');
    expect(seedAdmin?.cloudUserId).toBeNull();
  });
});
