import type { User } from '../../domain/models/user';
import type { SqlExecutor } from '../db/sql-executor';
import { resolveAuthSource } from '../../domain/identity/app-actor-mapper';
import type { UserRole } from '../../domain/models/enums';
import { verifyPassword } from '../security/password-hash';

export interface ProvisionedFieldUserInput {
  cloudUserId: string;
  username: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  passwordHash: string;
  provisionedAt: string;
}

export interface SyncProvisionedUsersResult {
  upserted: number;
  deactivated: number;
  skippedSeedConflicts: number;
}

export interface EnrolledFieldUserInput {
  cloudUserId: string;
  username: string;
  displayName: string;
  role: UserRole;
  passwordHash: string;
  provisionedAt: string;
}

export interface UserRepository {
  findByUsername(username: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  verifyCredentials(username: string, password: string): Promise<User | null>;
  updatePasswordHash(userId: string, passwordHash: string): Promise<void>;
  updateFieldUserFromCloud(input: {
    cloudUserId: string;
    role?: UserRole;
    displayName?: string;
    isActive?: boolean;
  }): Promise<void>;
  syncProvisionedUsers(users: ProvisionedFieldUserInput[]): Promise<SyncProvisionedUsersResult>;
  applyEnrolledFieldUser(input: EnrolledFieldUserInput): Promise<User>;
  finalizeEnrollmentCleanup(cloudUserId: string, role: UserRole): Promise<void>;
  setActiveByCloudUserId(cloudUserId: string, isActive: boolean): Promise<void>;
}

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  role: string;
  is_active: number;
  display_name: string | null;
  cloud_user_id: string | null;
  auth_mode: string | null;
  provisioned_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role as User['role'],
    isActive: row.is_active === 1,
    displayName: row.display_name,
    cloudUserId: row.cloud_user_id,
    authSource: resolveAuthSource(row.auth_mode),
    provisionedAt: row.provisioned_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function localIdForCloudUser(cloudUserId: string): string {
  return `f-${cloudUserId}`;
}

export function createSqliteUserRepository(getDb: () => Promise<SqlExecutor>): UserRepository {
  return {
    async findByUsername(username) {
      const db = await getDb();
      const row = await db.getFirst<UserRow>(
        'SELECT * FROM users WHERE username = ? COLLATE NOCASE',
        [username.trim().toLowerCase()]
      );
      return row ? mapRow(row) : null;
    },

    async findById(id) {
      const db = await getDb();
      const row = await db.getFirst<UserRow>('SELECT * FROM users WHERE id = ?', [id]);
      return row ? mapRow(row) : null;
    },

    async verifyCredentials(username, password) {
      const user = await this.findByUsername(username);
      if (!user || !user.isActive) return null;
      const ok = await verifyPassword(password, user.passwordHash);
      return ok ? user : null;
    },

    async updatePasswordHash(userId, passwordHash) {
      const db = await getDb();
      await db.run(
        `UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`,
        [passwordHash, userId]
      );
    },

    async updateFieldUserFromCloud(input) {
      const db = await getDb();
      const sets: string[] = ['updated_at = datetime(\'now\')'];
      const params: unknown[] = [];

      if (input.role != null) {
        sets.push('role = ?');
        params.push(input.role);
      }
      if (input.displayName != null) {
        sets.push('display_name = ?');
        params.push(input.displayName);
      }
      if (input.isActive != null) {
        sets.push('is_active = ?');
        params.push(input.isActive ? 1 : 0);
      }

      params.push(input.cloudUserId);
      await db.run(
        `UPDATE users SET ${sets.join(', ')} WHERE cloud_user_id = ?`,
        params
      );
    },

    async syncProvisionedUsers(users) {
      const db = await getDb();
      let upserted = 0;
      let skippedSeedConflicts = 0;
      let deactivated = 0;
      const syncedCloudIds: string[] = [];

      await db.withTransaction(async () => {
        for (const incoming of users) {
          syncedCloudIds.push(incoming.cloudUserId);
          const username = incoming.username.trim().toLowerCase();

          const byCloud = await db.getFirst<UserRow>(
            'SELECT * FROM users WHERE cloud_user_id = ?',
            [incoming.cloudUserId]
          );

          const byUsername = await db.getFirst<UserRow>(
            'SELECT * FROM users WHERE username = ? COLLATE NOCASE',
            [username]
          );

          if (
            byUsername &&
            byUsername.cloud_user_id !== incoming.cloudUserId &&
            resolveAuthSource(byUsername.auth_mode) === 'local_seed'
          ) {
            skippedSeedConflicts += 1;
            continue;
          }

          const localId = byCloud?.id ?? localIdForCloudUser(incoming.cloudUserId);
          const ts = incoming.provisionedAt;

          if (byCloud || (byUsername && byUsername.id === localId)) {
            await db.run(
              `UPDATE users SET
                 username = ?, password_hash = ?, role = ?, is_active = ?, display_name = ?,
                 cloud_user_id = ?, auth_mode = 'local_provisioned', provisioned_at = ?, updated_at = ?
               WHERE id = ?`,
              [
                username,
                incoming.passwordHash,
                incoming.role,
                incoming.isActive ? 1 : 0,
                incoming.displayName,
                incoming.cloudUserId,
                ts,
                ts,
                localId,
              ]
            );
          } else {
            await db.run(
              `INSERT INTO users (
                 id, username, password_hash, role, is_active, display_name,
                 cloud_user_id, auth_mode, provisioned_at, created_at, updated_at
               ) VALUES (?, ?, ?, ?, ?, ?, ?, 'local_provisioned', ?, ?, ?)`,
              [
                localId,
                username,
                incoming.passwordHash,
                incoming.role,
                incoming.isActive ? 1 : 0,
                incoming.displayName,
                incoming.cloudUserId,
                ts,
                ts,
                ts,
              ]
            );
          }

          upserted += 1;
        }

        if (syncedCloudIds.length > 0) {
          const placeholders = syncedCloudIds.map(() => '?').join(', ');
          const orphanRows = await db.getAll<{ id: string }>(
            `SELECT id FROM users
             WHERE auth_mode = 'local_provisioned'
               AND cloud_user_id IS NOT NULL
               AND cloud_user_id NOT IN (${placeholders})
               AND is_active = 1`,
            syncedCloudIds
          );
          deactivated = orphanRows.length;

          if (deactivated > 0) {
            await db.run(
              `UPDATE users SET is_active = 0, updated_at = datetime('now')
               WHERE auth_mode = 'local_provisioned'
                 AND cloud_user_id IS NOT NULL
                 AND cloud_user_id NOT IN (${placeholders})`,
              syncedCloudIds
            );
          }
        }
      });

      return {
        upserted,
        deactivated,
        skippedSeedConflicts,
      };
    },

    async applyEnrolledFieldUser(input) {
      const db = await getDb();
      const username = input.username.trim().toLowerCase();
      const localId = localIdForCloudUser(input.cloudUserId);
      const ts = input.provisionedAt;
      let targetUserId = localId;

      await db.withTransaction(async () => {
        const byCloud = await db.getFirst<UserRow>('SELECT * FROM users WHERE cloud_user_id = ?', [
          input.cloudUserId,
        ]);
        const byUsername = await db.getFirst<UserRow>(
          'SELECT * FROM users WHERE username = ? COLLATE NOCASE',
          [username]
        );

        const target = byCloud ?? byUsername;
        targetUserId = target?.id ?? localId;

        if (target) {
          await db.run(
            `UPDATE users SET
               username = ?, password_hash = ?, role = ?, is_active = 1, display_name = ?,
               cloud_user_id = ?, auth_mode = 'local_provisioned', provisioned_at = ?, updated_at = ?
             WHERE id = ?`,
            [
              username,
              input.passwordHash,
              input.role,
              input.displayName,
              input.cloudUserId,
              ts,
              ts,
              targetUserId,
            ]
          );
        } else {
          await db.run(
            `INSERT INTO users (
               id, username, password_hash, role, is_active, display_name,
               cloud_user_id, auth_mode, provisioned_at, created_at, updated_at
             ) VALUES (?, ?, ?, ?, 1, ?, ?, 'local_provisioned', ?, ?, ?)`,
            [
              localId,
              username,
              input.passwordHash,
              input.role,
              input.displayName,
              input.cloudUserId,
              ts,
              ts,
              ts,
            ]
          );
        }
      });

      const user = await this.findById(targetUserId);
      if (!user) throw new Error('No se pudo guardar el usuario enrollado');
      return user;
    },

    async finalizeEnrollmentCleanup(cloudUserId, role) {
      const db = await getDb();
      await db.withTransaction(async () => {
        await db.run(
          `DELETE FROM users
           WHERE auth_mode = 'local_provisioned'
             AND cloud_user_id IS NOT NULL
             AND cloud_user_id != ?`,
          [cloudUserId]
        );

        if (role === 'operador') {
          await db.run(
            `DELETE FROM users
             WHERE auth_mode = 'local_seed' AND role = 'operador'`
          );
        }
      });
    },

    async setActiveByCloudUserId(cloudUserId, isActive) {
      const db = await getDb();
      await db.run(
        `UPDATE users SET is_active = ?, updated_at = datetime('now') WHERE cloud_user_id = ?`,
        [isActive ? 1 : 0, cloudUserId]
      );
    },
  };
}
