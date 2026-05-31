import type { DeviceRegistration } from '../../domain/models/user';
import type { SqlExecutor } from '../db/sql-executor';

export interface SaveEnrolledDeviceInput {
  id: string;
  userId: string;
  deviceFingerprint: string;
  cloudDeviceId: string;
  validUntil: string | null;
  isBlocked: boolean;
  registeredAt: string;
  platform: string | null;
  appVersion: string | null;
  metadataJson?: string | null;
}

export interface DeviceRepository {
  getEnrolledDevice(): Promise<DeviceRegistration | null>;
  saveEnrolledDevice(input: SaveEnrolledDeviceInput): Promise<void>;
  updateCachedStatus(input: {
    cloudDeviceId: string;
    enrollmentStatus: DeviceRegistration['enrollmentStatus'];
    isBlocked: boolean;
    validUntil: string | null;
    lastSyncAt: string;
    appVersion?: string | null;
    platform?: string | null;
  }): Promise<void>;
}

interface DeviceRow {
  id: string;
  user_id: string;
  device_fingerprint: string;
  cloud_device_id: string | null;
  valid_until: string | null;
  is_blocked: number;
  registered_at: string;
  last_sync_at: string | null;
  platform: string | null;
  app_version: string | null;
  enrollment_status: string;
  notes: string | null;
  metadata_json: string | null;
}

function mapRow(row: DeviceRow): DeviceRegistration {
  return {
    id: row.id,
    userId: row.user_id,
    deviceFingerprint: row.device_fingerprint,
    cloudDeviceId: row.cloud_device_id,
    validUntil: row.valid_until,
    isBlocked: row.is_blocked === 1,
    registeredAt: row.registered_at,
    lastSyncAt: row.last_sync_at,
    platform: row.platform,
    appVersion: row.app_version,
    enrollmentStatus: row.enrollment_status as DeviceRegistration['enrollmentStatus'],
    notes: row.notes,
    metadataJson: row.metadata_json,
  };
}

export function createSqliteDeviceRepository(
  getDb: () => Promise<SqlExecutor>
): DeviceRepository {
  return {
    async getEnrolledDevice() {
      const db = await getDb();
      const row = await db.getFirst<DeviceRow>(
        `SELECT * FROM devices
         WHERE enrollment_status = 'enrolled'
         ORDER BY registered_at DESC
         LIMIT 1`
      );
      return row ? mapRow(row) : null;
    },

    async saveEnrolledDevice(input) {
      const db = await getDb();
      await db.run(
        `INSERT INTO devices (
           id, user_id, device_fingerprint, cloud_device_id, valid_until, is_blocked,
           registered_at, last_sync_at, platform, app_version, enrollment_status,
           notes, metadata_json
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'enrolled', NULL, ?)
         ON CONFLICT(user_id, device_fingerprint) DO UPDATE SET
           cloud_device_id = excluded.cloud_device_id,
           valid_until = excluded.valid_until,
           is_blocked = excluded.is_blocked,
           registered_at = excluded.registered_at,
           last_sync_at = excluded.last_sync_at,
           platform = excluded.platform,
           app_version = excluded.app_version,
           enrollment_status = 'enrolled',
           metadata_json = excluded.metadata_json`,
        [
          input.id,
          input.userId,
          input.deviceFingerprint,
          input.cloudDeviceId,
          input.validUntil,
          input.isBlocked ? 1 : 0,
          input.registeredAt,
          input.registeredAt,
          input.platform,
          input.appVersion,
          input.metadataJson ?? null,
        ]
      );
    },

    async updateCachedStatus(input) {
      const db = await getDb();
      await db.run(
        `UPDATE devices SET
           enrollment_status = ?,
           is_blocked = ?,
           valid_until = ?,
           last_sync_at = ?,
           platform = COALESCE(?, platform),
           app_version = COALESCE(?, app_version)
         WHERE cloud_device_id = ?`,
        [
          input.enrollmentStatus,
          input.isBlocked ? 1 : 0,
          input.validUntil,
          input.lastSyncAt,
          input.platform ?? null,
          input.appVersion ?? null,
          input.cloudDeviceId,
        ]
      );
    },
  };
}
