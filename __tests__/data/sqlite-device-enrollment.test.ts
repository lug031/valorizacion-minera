import { createTestSqlExecutor } from '../../src/data/db/test-sql-executor';
import { runMigrations } from '../../src/data/db/migrations';
import { createSqliteUserRepository } from '../../src/data/repositories/sqlite-user-repository';
import { createSqliteDeviceRepository } from '../../src/data/repositories/sqlite-device-repository';

describe('sqlite enrollment persistence', () => {
  const db = createTestSqlExecutor();
  const getDb = async () => db;

  beforeAll(async () => {
    await runMigrations(db);
  });

  afterAll(() => {
    db.close();
  });

  it('aplica usuario enrollado y purga otros provisioned', async () => {
    const users = createSqliteUserRepository(getDb);
    const devices = createSqliteDeviceRepository(getDb);

    await users.syncProvisionedUsers([
      {
        cloudUserId: 'cloud-a',
        username: 'operador.a',
        displayName: 'Operador A',
        role: 'operador',
        isActive: true,
        passwordHash: 'vm-sha256:a',
        provisionedAt: '2026-05-27T10:00:00.000Z',
      },
      {
        cloudUserId: 'cloud-b',
        username: 'operador.b',
        displayName: 'Operador B',
        role: 'operador',
        isActive: true,
        passwordHash: 'vm-sha256:b',
        provisionedAt: '2026-05-27T10:00:00.000Z',
      },
    ]);

    const enrolled = await users.applyEnrolledFieldUser({
      cloudUserId: 'cloud-a',
      username: 'operador.a',
      displayName: 'Operador A',
      role: 'operador',
      passwordHash: 'vm-sha256:a-new',
      provisionedAt: '2026-05-27T11:00:00.000Z',
    });

    await users.finalizeEnrollmentCleanup('cloud-a', 'operador');

    await devices.saveEnrolledDevice({
      id: 'local-dev-1',
      userId: enrolled.id,
      deviceFingerprint: 'vm-sha256:fingerprint',
      cloudDeviceId: 'cloud-device-1',
      validUntil: null,
      isBlocked: false,
      registeredAt: '2026-05-27T11:00:00.000Z',
      platform: 'android',
      appVersion: '0.1.0',
    });

    const remaining = await db.getAll<{ username: string }>('SELECT username FROM users ORDER BY username');
    expect(remaining.map((r) => r.username)).toContain('operador.a');
    expect(remaining.map((r) => r.username)).not.toContain('operador.b');
    expect(remaining.map((r) => r.username)).not.toContain('operador');

    const device = await devices.getEnrolledDevice();
    expect(device?.cloudDeviceId).toBe('cloud-device-1');
    expect(device?.userId).toBe(enrolled.id);
  });
});
