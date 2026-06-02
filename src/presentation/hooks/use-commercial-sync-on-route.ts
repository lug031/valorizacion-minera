import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import { scheduleForegroundSync } from '../../services/sync/foreground-sync.service';

/**
 * Al navegar entre pantallas de la app autenticada, intenta sync automática (con throttle).
 * Complementa useForegroundSync (solo al volver de segundo plano o reconectar red).
 */
export function useCommercialSyncOnRoute(enabled: boolean): void {
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled) return;
    scheduleForegroundSync();
  }, [pathname, enabled]);
}
