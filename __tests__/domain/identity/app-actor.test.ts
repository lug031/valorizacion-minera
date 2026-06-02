import type { AppActor } from '../../../src/domain/models/app-actor';
import { appActorToValuationActor, userToAppActor } from '../../../src/domain/identity/app-actor-mapper';
import { canSyncMasterConfig } from '../../../src/domain/identity/sync-access';
import type { User } from '../../../src/domain/models/user';

const baseUser: User = {
  id: 'u-operador',
  username: 'operador',
  passwordHash: 'vm-sha256:abc',
  role: 'operador',
  isActive: true,
  displayName: 'Operador Campo',
  cloudUserId: null,
  authSource: 'local_seed',
  provisionedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('identidad AppActor', () => {
  it('mapea User SQLite a AppActor', () => {
    const actor = userToAppActor(baseUser);
    expect(actor).toMatchObject({
      id: 'u-operador',
      cloudUserId: null,
      authSource: 'local_seed',
      username: 'operador',
      role: 'operador',
      displayName: 'Operador Campo',
    });
  });

  it('propaga cloudUserId hacia ValuationActor', () => {
    const provisioned: User = {
      ...baseUser,
      cloudUserId: 'cognito-sub-123',
      authSource: 'local_provisioned',
      provisionedAt: '2026-05-01T00:00:00.000Z',
    };
    const actor = userToAppActor(provisioned);
    const valuationActor = appActorToValuationActor(actor);
    expect(valuationActor.cloudUserId).toBe('cognito-sub-123');
  });

  it('permite descarga de config maestra a admin y operador', () => {
    const admin: AppActor = { ...userToAppActor(baseUser), id: 'u-admin', role: 'admin' };
    expect(canSyncMasterConfig(admin.role)).toBe(true);
    expect(canSyncMasterConfig(baseUser.role)).toBe(true);
  });
});
