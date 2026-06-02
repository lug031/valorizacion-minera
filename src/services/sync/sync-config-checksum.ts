import type { SyncCloudPayload } from './sync-config.schemas';
import type { SyncMetadata } from './sync-config.types';

export function configPayloadChecksum(payload: SyncCloudPayload): string {
  return JSON.stringify(payload);
}

/** El bundle de la web no cambió desde la última sync exitosa en este dispositivo. */
export function isConfigBundleUnchanged(
  previous: SyncMetadata,
  payload: SyncCloudPayload
): boolean {
  return (
    previous.status === 'success' &&
    Boolean(previous.lastSyncAt) &&
    Boolean(previous.rawChecksum) &&
    previous.rawChecksum === configPayloadChecksum(payload)
  );
}
