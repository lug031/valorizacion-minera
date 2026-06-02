import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { scheduleForegroundSync } from '../../services/sync/foreground-sync.service';

/**
 * Config maestra y envío de cotizaciones al recuperar red o volver a primer plano.
 */
export function useForegroundSync(enabled: boolean): void {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const syncingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const trySync = async () => {
      if (syncingRef.current) return;
      syncingRef.current = true;
      try {
        const net = await NetInfo.fetch();
        if (!net.isConnected) return;
        scheduleForegroundSync();
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
