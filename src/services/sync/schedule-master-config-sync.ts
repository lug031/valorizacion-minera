import { getEnrollmentMode } from '../../infrastructure/device/enrollment-store';
import { useAuthStore } from '../../presentation/store/auth-store';
import { useSyncStore } from '../../presentation/store/sync-store';

const MIN_INTERVAL_MS = 45_000;

let inFlight: Promise<void> | null = null;
let lastCompletedAt = 0;

export type MasterConfigSyncOptions = {
  /** Omite throttle (activación de dispositivo, sync manual forzado). */
  force?: boolean;
};

/**
 * Descarga config maestra (catálogos + defaults) con throttle y mutex.
 */
export function scheduleMasterConfigSync(options?: MasterConfigSyncOptions): void {
  void runMasterConfigSyncThrottled(options);
}

export async function runMasterConfigSyncThrottled(
  options?: MasterConfigSyncOptions
): Promise<void> {
  if (inFlight) return inFlight;

  const now = Date.now();
  if (
    !options?.force &&
    lastCompletedAt > 0 &&
    now - lastCompletedAt < MIN_INTERVAL_MS
  ) {
    return;
  }

  const actor = useAuthStore.getState().user;
  if (!actor) {
    return;
  }

  const mode = await getEnrollmentMode();
  if (mode !== 'enrolled') {
    return;
  }

  inFlight = (async () => {
    try {
      await useSyncStore.getState().syncNow();
      lastCompletedAt = Date.now();
    } catch {
      /* metadata.errorMessage en sync-store */
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
