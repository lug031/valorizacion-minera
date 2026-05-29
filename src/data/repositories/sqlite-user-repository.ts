import type { User } from '../../domain/models/user';
import type { SqlExecutor } from '../db/sql-executor';
import { verifyPassword } from '../security/password-hash';

export interface UserRepository {
  findByUsername(username: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  verifyCredentials(username: string, password: string): Promise<User | null>;
}

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  role: string;
  is_active: number;
  display_name: string | null;
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
  };
}
