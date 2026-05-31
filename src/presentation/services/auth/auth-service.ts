import type { AppActor } from '../../../domain/models/app-actor';
import { userToAppActor } from '../../../domain/identity/app-actor-mapper';
import { userRepository } from '../../../data/repositories';
import { saveSessionToken, getSessionToken, clearSessionToken } from './session-storage';

/** Sesión operativa local (alias de AppActor para compatibilidad). */
export type AuthUser = AppActor;

function makeToken(userId: string): string {
  return `mock-${userId}-${Date.now()}`;
}

function parseUserIdFromToken(token: string): string | null {
  if (!token.startsWith('mock-')) return null;
  const parts = token.split('-');
  if (parts.length < 4) return null;
  return `${parts[1]}-${parts[2]}`;
}

export async function loginLocal(
  username: string,
  password: string
): Promise<AuthUser | null> {
  const user = await userRepository.verifyCredentials(username, password);
  if (!user) return null;

  const authUser = userToAppActor(user);

  const token = makeToken(user.id);
  await saveSessionToken(token);
  await recordSession(authUser.id, token);
  return authUser;
}

import { getSqlExecutor } from '../../../data/db/database';

async function recordSession(userId: string, token: string): Promise<void> {
  try {
    const db = await getSqlExecutor();
    const tokenId = token.slice(0, 48);
    await db.run(
      `INSERT INTO sessions (id, user_id, token_id, expires_at, created_at)
       VALUES (?, ?, ?, datetime('now', '+30 days'), datetime('now'))`,
      [`sess-${Date.now()}`, userId, tokenId]
    );
  } catch {
    /* offline MVP: sesión en SecureStore es suficiente */
  }
}

export async function logoutLocal(): Promise<void> {
  await clearSessionToken();
}

export async function restoreSession(): Promise<AuthUser | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const userId = parseUserIdFromToken(token);
  if (!userId) return null;

  const user = await userRepository.findById(userId);
  if (!user || !user.isActive) return null;

  return userToAppActor(user);
}
