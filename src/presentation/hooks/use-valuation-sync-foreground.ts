import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { getEnrollmentMode } from '../../infrastructure/device/enrollment-store';
import { scheduleValuationSync } from '../../services/sync/sync-valuations.service';

/**
 * Envía cotizaciones pendientes al recuperar conexión o al volver a primer plano.
 */
export function useValuationSyncForeground(enabled: boolean): void {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const syncingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const trySync = async () => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      try {
        const mode = await getEnrollmentMode();
        if (mode !== 'enrolled') return;
        const net = await NetInfo.fetch();
        if (!net.isConnected) return;
        scheduleValuationSync();
      } finally {
        syncingRef.current = false;
      }
    };

    const appSub = AppState.addEventListener('change', (nextState) => {
      const wasBackground =
        appStateRef.current === 'background' || appStateRef.current === 'inactive';
      appStateRef.current = nextState;
      if (wasBackground && nextState === 'active') {
        void trySync();
      }
    });

    const netSub = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        void trySync();
      }
    });

    void trySync();

    return () => {
      appSub.remove();
      netSub();
    };
  }, [enabled]);
}
