import Constants from 'expo-constants';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { valuationRepository, deviceRepository } from '../../data/repositories';
import { getCloudDeviceId, getEnrollmentMode } from '../../infrastructure/device/enrollment-store';
import { runEnrollmentGraphql } from '../../infrastructure/amplify/mobile-enrollment-client';
import { getDeviceFingerprintHash } from '../device/device-fingerprint.service';
import { logDev } from '../../config/dev-log';
import { parseValuationSyncError, valuationSyncErrorMessage } from './valuation-sync-errors';
import { VALUATION_SKIP_NO_CLOUD_USER_MESSAGE } from './sync-valuation-messages';
import type { ValuationPushRow } from '../../data/repositories/valuation-repository';

export interface SyncValuationsResult {
  attempted: number;
  synced: number;
  skipped: number;
  failed: number;
  /** Filas que estaban en syncing y se devolvieron a pending al iniciar */
  recoveredOrphans: number;
  errors: string[];
}

type PushMutationRow = {
  pushMobileValuation?: {
    cloudValuationId?: string;
    mobileId?: string;
    syncStatus?: string;
    alreadyExisted?: boolean;
    serverTime?: string;
  } | null;
};

const PUSH_MOBILE_VALUATION = /* GraphQL */ `
  mutation PushMobileValuation(
    $mobileId: String!
    $code: String!
    $fecha: String!
    $materialTypeCode: String!
    $providerName: String
    $observaciones: String
    $formulaVersion: String!
    $snapshotJson: String!
    $createdByFieldUserId: String!
    $createdByUsername: String!
    $createdByDisplayName: String
    $sourceCreatedAt: String!
    $sourceUpdatedAt: String!
    $cloudDeviceId: ID!
    $deviceFingerprintHash: String!
    $fieldDeviceLabel: String
    $platform: String
    $appVersion: String
  ) {
    pushMobileValuation(
      mobileId: $mobileId
      code: $code
      fecha: $fecha
      materialTypeCode: $materialTypeCode
      providerName: $providerName
      observaciones: $observaciones
      formulaVersion: $formulaVersion
      snapshotJson: $snapshotJson
      createdByFieldUserId: $createdByFieldUserId
      createdByUsername: $createdByUsername
      createdByDisplayName: $createdByDisplayName
      sourceCreatedAt: $sourceCreatedAt
      sourceUpdatedAt: $sourceUpdatedAt
      cloudDeviceId: $cloudDeviceId
      deviceFingerprintHash: $deviceFingerprintHash
      fieldDeviceLabel: $fieldDeviceLabel
      platform: $platform
      appVersion: $appVersion
    ) {
      cloudValuationId
      mobileId
      syncStatus
      alreadyExisted
      serverTime
    }
  }
`;

function resolveAppVersion(): string {
  return Constants.expoConfig?.version ?? '0.1.0';
}

function resolveDeviceLabel(metadataJson: string | null): string | null {
  if (!metadataJson) return null;
  try {
    const parsed = JSON.parse(metadataJson) as { deviceLabel?: string | null };
    const label = parsed.deviceLabel?.trim();
    return label || null;
  } catch {
    return null;
  }
}

function isSkipNoCloudUserError(message: string): boolean {
  return message.includes(VALUATION_SKIP_NO_CLOUD_USER_MESSAGE);
}

async function pushOneRow(
  row: ValuationPushRow,
  cloudDeviceId: string,
  deviceFingerprintHash: string,
  fieldDeviceLabel: string | null
): Promise<void> {
  if (!row.cloudUserId?.trim()) {
    throw new Error(VALUATION_SKIP_NO_CLOUD_USER_MESSAGE);
  }

  await valuationRepository.markSyncing(row.id);

  try {
    const data = await runEnrollmentGraphql<PushMutationRow>(PUSH_MOBILE_VALUATION, {
      mobileId: row.id,
      code: row.code,
      fecha: row.fecha,
      materialTypeCode: row.materialTypeCode,
      providerName: row.providerName,
      observaciones: row.observaciones,
      formulaVersion: row.formulaVersion,
      snapshotJson: row.snapshotJson,
      createdByFieldUserId: row.cloudUserId,
      createdByUsername: row.createdByUsername,
      createdByDisplayName: row.createdByUsername,
      sourceCreatedAt: row.createdAt,
      sourceUpdatedAt: row.updatedAt,
      cloudDeviceId,
      deviceFingerprintHash,
      fieldDeviceLabel,
      platform: Platform.OS,
      appVersion: resolveAppVersion(),
    });

    const payload = data.pushMobileValuation;
    const cloudValuationId = payload?.cloudValuationId;
    if (!cloudValuationId) {
      throw new Error('Respuesta incompleta al sincronizar la cotización.');
    }

    await valuationRepository.markSynced(row.id, cloudValuationId);
  } catch (error) {
    const parsed = parseValuationSyncError(error);
    const message = valuationSyncErrorMessage(parsed.code, parsed.message);
    if (!isSkipNoCloudUserError(message)) {
      await valuationRepository.markSyncError(row.id, message);
    }
    throw new Error(message);
  }
}

let syncInFlight: Promise<SyncValuationsResult> | null = null;

async function runSyncPendingValuations(): Promise<SyncValuationsResult> {
  const result: SyncValuationsResult = {
    attempted: 0,
    synced: 0,
    skipped: 0,
    failed: 0,
    recoveredOrphans: 0,
    errors: [],
  };

  const net = await NetInfo.fetch();
  if (!net.isConnected) {
    return result;
  }

  const enrollmentMode = await getEnrollmentMode();
  if (enrollmentMode !== 'enrolled') {
    return result;
  }

  const cloudDeviceId = await getCloudDeviceId();
  if (!cloudDeviceId) {
    return result;
  }

  const device = await deviceRepository.getBindingDevice(cloudDeviceId);
  if (!device || device.enrollmentStatus !== 'enrolled') {
    return result;
  }

  result.recoveredOrphans = await valuationRepository.resetOrphanedSyncing();
  if (result.recoveredOrphans > 0) {
    logDev('[sync-valuations] recovered orphaned syncing rows', result.recoveredOrphans);
  }

  const deviceFingerprintHash = await getDeviceFingerprintHash();
  const fieldDeviceLabel = resolveDeviceLabel(device.metadataJson);
  const pending = await valuationRepository.listPendingForSync();

  for (const row of pending) {
    result.attempted += 1;
    try {
      await pushOneRow(row, cloudDeviceId, deviceFingerprintHash, fieldDeviceLabel);
      result.synced += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al sincronizar';
      if (isSkipNoCloudUserError(message)) {
        result.skipped += 1;
      } else {
        result.failed += 1;
        if (!result.errors.includes(message)) {
          result.errors.push(message);
        }
      }
    }
  }

  return result;
}

/**
 * Recupera filas huérfanas en `syncing` antes de procesar la cola.
 * Una sola ejecución a la vez (evita carrera entre envío automático y botón manual).
 */
export async function syncPendingValuations(): Promise<SyncValuationsResult> {
  if (syncInFlight) return syncInFlight;
  syncInFlight = runSyncPendingValuations().finally(() => {
    syncInFlight = null;
  });
  return syncInFlight;
}

/** Espera si hay un envío en curso (p. ej. al abrir Historial tras guardar). */
export async function waitForValuationSyncIfRunning(): Promise<void> {
  if (syncInFlight) await syncInFlight;
}

/** Intenta subir cotizaciones pendientes sin bloquear la UI. */
export function scheduleValuationSync(): void {
  void syncPendingValuations();
}
