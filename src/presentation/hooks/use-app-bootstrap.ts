import { useEffect, useState } from 'react';
import { initDataLayer } from '../../data/repositories';
import { refreshDeviceBindingGate } from '../../services/device/refresh-device-binding';
import { useAuthStore } from '../store/auth-store';
import { useSettingsStore } from '../store/settings-store';
import { useConfigStore } from '../store/config-store';
import { useSyncStore } from '../store/sync-store';

/**
 * Inicializa SQLite + hidrata stores (settings, config, auth).
 */
export function useAppBootstrap(): { ready: boolean; error: string | null } {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrateFromDb);
  const hydrateConfig = useConfigStore((s) => s.hydrate);
  const hydrateSync = useSyncStore((s) => s.hydrate);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initDataLayer();
        await refreshDeviceBindingGate();
        await hydrateSettings();
        await hydrateConfig();
        await hydrateSync();
        await hydrateAuth();
        if (!cancelled) setReady(true);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Error al iniciar base de datos');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrateAuth, hydrateSettings, hydrateConfig, hydrateSync]);

  return { ready, error };
}
