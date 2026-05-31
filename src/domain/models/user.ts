import type { AuthSource, UserRole } from './enums';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  displayName: string | null;
  /** Cognito sub o id cloud cuando el usuario esté provisionado (fase posterior). */
  cloudUserId: string | null;
  authSource: AuthSource;
  provisionedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceRegistration {
  id: string;
  userId: string;
  deviceFingerprint: string;
  cloudDeviceId: string | null;
  validUntil: string | null;
  isBlocked: boolean;
  registeredAt: string;
  lastSyncAt: string | null;
  platform: string | null;
  appVersion: string | null;
  enrollmentStatus: 'local' | 'pending' | 'enrolled' | 'revoked';
  notes: string | null;
  metadataJson: string | null;
}

export interface Session {
  token: string;
  userId: string;
  expiresAt: string;
}
