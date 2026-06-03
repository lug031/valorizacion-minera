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
  graceDaysOffline?: number | null;
  usagePolicy?: 'standard' | 'trial';
  trialLimitMinutes?: number | null;
  usageQuotaResetAt?: string | null;
  usageQuotaResetAppliedAt?: string | null;
}

export interface DeviceRepository {
  getEnrolledDevice(): Promise<DeviceRegistration | null>;
  getBindingDevice(cloudDeviceId?: string | null): Promise<DeviceRegistration | null>;
  saveEnrolledDevice(input: SaveEnrolledDeviceInput): Promise<void>;
  updateCachedStatus(input: {
    cloudDeviceId: string;
    enrollmentStatus: DeviceRegistration['enrollmentStatus'];
    isBlocked: boolean;
    validUntil: string | null;
    lastSyncAt: string;
    appVersion?: string | null;
    platform?: string | null;
    graceDaysOffline?: number | null;
    usagePolicy?: 'standard' | 'trial';
    trialLimitMinutes?: number | null;
    usageQuotaResetAt?: string | null;
  }): Promise<void>;
  addUsageAccumulatedMs(cloudDeviceId: string, deltaMs: number): Promise<void>;
  resetUsageAccumulated(cloudDeviceId: string): Promise<void>;
  applyUsageQuotaReset(input: {
    cloudDeviceId: string;
    usageQuotaResetAt: string;
    trialLimitMinutes?: number | null;
  }): Promise<void>;
  markUsageQuotaResetApplied(cloudDeviceId: string, usageQuotaResetAt: string): Promise<void>;
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
  grace_days_offline: number | null;
  usage_policy: string | null;
  trial_limit_minutes: number | null;
  usage_quota_reset_at: string | null;
  usage_quota_reset_applied_at: string | null;
  usage_accumulated_ms: number | null;
}

function mapRow(row: DeviceRow): DeviceRegistration {
  const policy = row.usage_policy === 'trial' ? 'trial' : 'standard';
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
    graceDaysOffline: row.grace_days_offline,
    usagePolicy: policy,
    trialLimitMinutes: row.trial_limit_minutes,
    usageQuotaResetAt: row.usage_quota_reset_at,
    usageQuotaResetAppliedAt: row.usage_quota_reset_applied_at,
    usageAccumulatedMs: row.usage_accumulated_ms ?? 0,
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

    async getBindingDevice(cloudDeviceId) {
      const db = await getDb();
      if (cloudDeviceId) {
        const byCloud = await db.getFirst<DeviceRow>(
          `SELECT * FROM devices WHERE cloud_device_id = ? LIMIT 1`,
          [cloudDeviceId]
        );
        if (byCloud) return mapRow(byCloud);
      }

      const row = await db.getFirst<DeviceRow>(
        `SELECT * FROM devices
         WHERE cloud_device_id IS NOT NULL
           AND enrollment_status IN ('enrolled', 'revoked', 'pending')
         ORDER BY registered_at DESC
         LIMIT 1`
      );
      return row ? mapRow(row) : null;
    },

    async saveEnrolledDevice(input) {
      const db = await getDb();
      const usagePolicy = input.usagePolicy ?? 'standard';
      await db.run(
        `INSERT INTO devices (
           id, user_id, device_fingerprint, cloud_device_id, valid_until, is_blocked,
           registered_at, last_sync_at, platform, app_version, enrollment_status,
           grace_days_offline, usage_policy, trial_limit_minutes, usage_quota_reset_at,
           usage_quota_reset_applied_at, usage_accumulated_ms, notes, metadata_json
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'enrolled', ?, ?, ?, ?, ?, 0, NULL, ?)
         ON CONFLICT(user_id, device_fingerprint) DO UPDATE SET
           cloud_device_id = excluded.cloud_device_id,
           valid_until = excluded.valid_until,
           is_blocked = excluded.is_blocked,
           registered_at = excluded.registered_at,
           last_sync_at = excluded.last_sync_at,
           platform = excluded.platform,
           app_version = excluded.app_version,
           enrollment_status = 'enrolled',
           grace_days_offline = excluded.grace_days_offline,
           usage_policy = excluded.usage_policy,
           trial_limit_minutes = excluded.trial_limit_minutes,
           usage_quota_reset_at = excluded.usage_quota_reset_at,
           usage_quota_reset_applied_at = excluded.usage_quota_reset_applied_at,
           usage_accumulated_ms = 0,
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
          input.graceDaysOffline ?? null,
          usagePolicy,
          input.trialLimitMinutes ?? null,
          input.usageQuotaResetAt ?? null,
          input.usageQuotaResetAppliedAt ?? input.usageQuotaResetAt ?? null,
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
           app_version = COALESCE(?, app_version),
           grace_days_offline = COALESCE(?, grace_days_offline),
           usage_policy = COALESCE(?, usage_policy),
           trial_limit_minutes = COALESCE(?, trial_limit_minutes),
           usage_quota_reset_at = COALESCE(?, usage_quota_reset_at)
         WHERE cloud_device_id = ?`,
        [
          input.enrollmentStatus,
          input.isBlocked ? 1 : 0,
          input.validUntil,
          input.lastSyncAt,
          input.platform ?? null,
          input.appVersion ?? null,
          input.graceDaysOffline ?? null,
          input.usagePolicy ?? null,
          input.trialLimitMinutes ?? null,
          input.usageQuotaResetAt ?? null,
          input.cloudDeviceId,
        ]
      );
    },

    async addUsageAccumulatedMs(cloudDeviceId, deltaMs) {
      if (deltaMs <= 0) return;
      const db = await getDb();
      await db.run(
        `UPDATE devices SET usage_accumulated_ms = COALESCE(usage_accumulated_ms, 0) + ?
         WHERE cloud_device_id = ?`,
        [deltaMs, cloudDeviceId]
      );
    },

    async resetUsageAccumulated(cloudDeviceId) {
      const db = await getDb();
      await db.run(
        `UPDATE devices SET usage_accumulated_ms = 0 WHERE cloud_device_id = ?`,
        [cloudDeviceId]
      );
    },

    async applyUsageQuotaReset(input) {
      const db = await getDb();
      await db.run(
        `UPDATE devices SET
           usage_accumulated_ms = 0,
           usage_quota_reset_at = ?,
           usage_quota_reset_applied_at = ?,
           trial_limit_minutes = COALESCE(?, trial_limit_minutes)
         WHERE cloud_device_id = ?`,
        [
          input.usageQuotaResetAt,
          input.usageQuotaResetAt,
          input.trialLimitMinutes ?? null,
          input.cloudDeviceId,
        ]
      );
    },

    async markUsageQuotaResetApplied(cloudDeviceId, usageQuotaResetAt) {
      const db = await getDb();
      await db.run(
        `UPDATE devices SET usage_quota_reset_applied_at = ? WHERE cloud_device_id = ?`,
        [usageQuotaResetAt, cloudDeviceId]
      );
    },
  };
}
