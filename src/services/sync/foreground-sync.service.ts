import NetInfo from '@react-native-community/netinfo';
import { getEnrollmentMode } from '../../infrastructure/device/enrollment-store';
import { useAuthStore } from '../../presentation/store/auth-store';
import { runMasterConfigSyncThrottled } from './schedule-master-config-sync';
import { syncPendingValuations } from './sync-valuations.service';

let foregroundInFlight: Promise<void> | null = null;

export type ForegroundSyncOptions = {
  /** Omite throttle de config (p. ej. tras activar dispositivo). */
  forceConfig?: boolean;
};

/**
 * Sync en primer plano / reconexión: primero config maestra, luego cotizaciones pendientes.
 */
export async function runForegroundSync(options?: ForegroundSyncOptions): Promise<void> {
  if (foregroundInFlight) return foregroundInFlight;

  foregroundInFlight = (async () => {
    const actor = useAuthStore.getState().user;
    if (!actor) return;

    const mode = await getEnrollmentMode();
    if (mode !== 'enrolled') return;

    const net = await NetInfo.fetch();
    if (!net.isConnected) return;

    await runMasterConfigSyncThrottled({ force: options?.forceConfig });
    await syncPendingValuations();
  })().finally(() => {
    foregroundInFlight = null;
  });

  return foregroundInFlight;
}

export function scheduleForegroundSync(options?: ForegroundSyncOptions): void {
  void runForegroundSync(options);
}
