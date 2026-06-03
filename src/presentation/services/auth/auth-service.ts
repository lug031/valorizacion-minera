import NetInfo from '@react-native-community/netinfo';
import type { AppActor } from '../../../domain/models/app-actor';
import { userToAppActor } from '../../../domain/identity/app-actor-mapper';
import type { User } from '../../../domain/models/user';
import { userRepository } from '../../../data/repositories';
import { hashPassword } from '../../../data/security/password-hash';
import { isDeviceEnrollmentRequired } from '../../../config/device-enrollment-required';
import { getCloudDeviceId, getEnrollmentMode, setEnrollmentMode } from '../../../infrastructure/device/enrollment-store';
import { saveSessionToken, getSessionToken, clearSessionToken } from './session-storage';
import { getDeviceFingerprintHash } from '../../../services/device/device-fingerprint.service';
import { tryIssueAndStoreDeviceSessionToken } from '../../../services/device/device-session-token.service';

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

function isEffectivelyOnline(net: { isConnected: boolean | null; isInternetReachable: boolean | null }): boolean {
  if (!net.isConnected) return false;
  return net.isInternetReachable !== false;
}

/** Valida contraseña en la nube (issueDeviceSessionToken) y alinea el hash local con la web. */
async function refreshLocalPasswordFromCloudIfEnrolled(
  password: string,
  user: User
): Promise<User | null> {
  const enrollmentMode = await getEnrollmentMode();
  if (enrollmentMode !== 'enrolled' || !user.cloudUserId) return null;

  const cloudDeviceId = await getCloudDeviceId();
  if (!cloudDeviceId) return null;

  const deviceFingerprintHash = await getDeviceFingerprintHash();
  const sessionToken = await tryIssueAndStoreDeviceSessionToken({
    cloudDeviceId,
    username: user.username,
    password,
    deviceFingerprintHash,
  });
  if (!sessionToken) return null;

  const passwordHash = await hashPassword(password);
  await userRepository.updatePasswordHash(user.id, passwordHash);
  return userRepository.findById(user.id);
}

export async function loginLocal(
  username: string,
  password: string
): Promise<AuthUser | null> {
  let user = await userRepository.verifyCredentials(username, password);

  if (!user) {
    const candidate = await userRepository.findByUsername(username);
    if (!candidate?.isActive) return null;
    user = await refreshLocalPasswordFromCloudIfEnrolled(password, candidate);
    if (!user) return null;
  } else {
    const enrollmentMode = await getEnrollmentMode();
    if (enrollmentMode === 'enrolled') {
      const net = await NetInfo.fetch();
      if (isEffectivelyOnline(net)) {
        const synced = await refreshLocalPasswordFromCloudIfEnrolled(password, user);
        if (!synced) return null;
        user = synced;
      }
    }
  }

  const authUser = userToAppActor(user);

  const enrollmentMode = await getEnrollmentMode();
  if (!enrollmentMode && !isDeviceEnrollmentRequired()) {
    await setEnrollmentMode('legacy_roster');
  }

  const token = makeToken(user.id);
  await saveSessionToken(token);
  if (enrollmentMode === 'enrolled') {
    const cloudDeviceId = await getCloudDeviceId();
    if (cloudDeviceId) {
      const deviceFingerprintHash = await getDeviceFingerprintHash();
      await tryIssueAndStoreDeviceSessionToken({
        cloudDeviceId,
        username: user.username,
        password,
        deviceFingerprintHash,
      });
    }
  }
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
