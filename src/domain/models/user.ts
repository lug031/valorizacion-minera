import type { UserRole } from './enums';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceRegistration {
  id: string;
  userId: string;
  deviceFingerprint: string;
  validUntil: string | null;
  isBlocked: boolean;
  registeredAt: string;
}

export interface Session {
  token: string;
  userId: string;
  expiresAt: string;
}
