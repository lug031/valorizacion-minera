import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { router } from 'expo-router';
import { getEnrollmentMode } from '../../infrastructure/device/enrollment-store';
import { refreshDeviceBindingGate } from '../../services/device/refresh-device-binding';
import { useDeviceBindingStore } from '../store/device-binding-store';

function navigateIfBlocked(): void {
  const { gateStatus } = useDeviceBindingStore.getState();
  if (gateStatus === 'blocked') {
    router.replace('/(auth)/device-blocked');
  }
}

/**
 * Revalida licencia al volver a foreground (solo dispositivos activados por código).
 * Sin polling: app start, login y resume.
 */
export function useDeviceBindingForeground(enabled: boolean): void {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const revalidatingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasBackground =
        appStateRef.current === 'background' || appStateRef.current === 'inactive';
      appStateRef.current = nextState;

      if (!wasBackground || nextState !== 'active') return;
      if (revalidatingRef.current) return;

      revalidatingRef.current = true;
      void (async () => {
        try {
          const mode = await getEnrollmentMode();
          if (mode !== 'enrolled') return;

          const net = await NetInfo.fetch();
          if (!net.isConnected) return;

          await refreshDeviceBindingGate();
          navigateIfBlocked();
        } finally {
          revalidatingRef.current = false;
        }
      })();
    });

    return () => subscription.remove();
  }, [enabled]);
}
