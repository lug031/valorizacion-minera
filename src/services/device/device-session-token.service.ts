import { logDevError } from '../../config/dev-log';
import { runEnrollmentGraphql } from '../../infrastructure/amplify/mobile-enrollment-client';
import {
  getDeviceSessionExpiresAt,
  getDeviceSessionToken,
  setDeviceSessionExpiresAt,
  setDeviceSessionToken,
} from '../../infrastructure/device/enrollment-store';

type DeviceSessionTokenMutationRow = {
  issueDeviceSessionToken?: {
    sessionToken?: string;
    expiresAt?: string;
    serverTime?: string;
  } | null;
};

type DeviceSessionRefreshMutationRow = {
  refreshDeviceSessionToken?: {
    sessionToken?: string;
    expiresAt?: string;
    serverTime?: string;
  } | null;
};

const ISSUE_DEVICE_SESSION_TOKEN = /* GraphQL */ `
  mutation IssueDeviceSessionToken(
    $cloudDeviceId: ID!
    $username: String!
    $password: String!
    $deviceFingerprintHash: String!
  ) {
    issueDeviceSessionToken(
      cloudDeviceId: $cloudDeviceId
      username: $username
      password: $password
      deviceFingerprintHash: $deviceFingerprintHash
    ) {
      sessionToken
      expiresAt
      serverTime
    }
  }
`;

const REFRESH_DEVICE_SESSION_TOKEN = /* GraphQL */ `
  mutation RefreshDeviceSessionToken(
    $cloudDeviceId: ID!
    $deviceFingerprintHash: String!
    $sessionToken: String!
  ) {
    refreshDeviceSessionToken(
      cloudDeviceId: $cloudDeviceId
      deviceFingerprintHash: $deviceFingerprintHash
      sessionToken: $sessionToken
    ) {
      sessionToken
      expiresAt
      serverTime
    }
  }
`;

const REFRESH_SAFETY_WINDOW_MS = 2 * 60 * 1000;

function shouldRefresh(expiresAt: string | null, now = Date.now()): boolean {
  if (!expiresAt) return true;
  const expMs = new Date(expiresAt).getTime();
  if (!Number.isFinite(expMs)) return true;
  return expMs <= now + REFRESH_SAFETY_WINDOW_MS;
}

export async function issueAndStoreDeviceSessionToken(params: {
  cloudDeviceId: string;
  username: string;
  password: string;
  deviceFingerprintHash: string;
}): Promise<string> {
  const data = await runEnrollmentGraphql<DeviceSessionTokenMutationRow>(ISSUE_DEVICE_SESSION_TOKEN, {
    cloudDeviceId: params.cloudDeviceId,
    username: params.username.trim().toLowerCase(),
    password: params.password,
    deviceFingerprintHash: params.deviceFingerprintHash,
  });
  const payload = data.issueDeviceSessionToken;
  if (!payload?.sessionToken || !payload.expiresAt) {
    throw new Error('No se pudo obtener token de sesión de dispositivo.');
  }
  await setDeviceSessionToken(payload.sessionToken);
  await setDeviceSessionExpiresAt(payload.expiresAt);
  return payload.sessionToken;
}

/** No bloquea activación/login si el backend aún no tiene DEVICE_SESSION_TOKEN_SECRET. */
export async function tryIssueAndStoreDeviceSessionToken(params: {
  cloudDeviceId: string;
  username: string;
  password: string;
  deviceFingerprintHash: string;
}): Promise<string | null> {
  try {
    return await issueAndStoreDeviceSessionToken(params);
  } catch (error) {
    logDevError('[device-session-token] issue_failed', error);
    return null;
  }
}

export async function getValidDeviceSessionToken(params: {
  cloudDeviceId: string;
  deviceFingerprintHash: string;
}): Promise<string> {
  const storedToken = await getDeviceSessionToken();
  const storedExpiresAt = await getDeviceSessionExpiresAt();
  if (!storedToken) {
    throw new Error('Sesión de dispositivo no disponible. Inicie sesión nuevamente.');
  }
  if (!shouldRefresh(storedExpiresAt)) return storedToken;

  const data = await runEnrollmentGraphql<DeviceSessionRefreshMutationRow>(REFRESH_DEVICE_SESSION_TOKEN, {
    cloudDeviceId: params.cloudDeviceId,
    deviceFingerprintHash: params.deviceFingerprintHash,
    sessionToken: storedToken,
  });
  const payload = data.refreshDeviceSessionToken;
  if (!payload?.sessionToken || !payload.expiresAt) {
    throw new Error('No se pudo refrescar token de sesión de dispositivo.');
  }
  await setDeviceSessionToken(payload.sessionToken);
  await setDeviceSessionExpiresAt(payload.expiresAt);
  return payload.sessionToken;
}
