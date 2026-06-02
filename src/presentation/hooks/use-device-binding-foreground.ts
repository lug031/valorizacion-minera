import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { router } from 'expo-router';
import { getEnrollmentMode } from '../../infrastructure/device/enrollment-store';
import { refreshDeviceBindingGate } from '../../services/device/refresh-device-binding';
import { useDeviceBindingStore } from '../store/device-binding-store';

const REVALIDATION_INTERVAL_MS = 15 * 60 * 1000;

function navigateIfBlocked(): void {
  const { gateStatus } = useDeviceBindingStore.getState();
  if (gateStatus === 'blocked') {
    router.replace('/(auth)/device-blocked');
  }
}

/**
 * Revalida licencia al volver a foreground y en intervalos mientras la app está activa.
 * Mantiene offline-first: solo ejecuta contra backend cuando hay conectividad.
 */
export function useDeviceBindingForeground(enabled: boolean): void {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const revalidatingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const runRevalidation = async () => {
      if (revalidatingRef.current) return;
      revalidatingRef.current = true;
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
    };

    // Ejecuta una verificación al montar para asegurar control periódico real.
    void runRevalidation();

    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasBackground =
        appStateRef.current === 'background' || appStateRef.current === 'inactive';
      appStateRef.current = nextState;

      if (!wasBackground || nextState !== 'active') return;
      void runRevalidation();
    });

    const interval = setInterval(() => {
      if (appStateRef.current !== 'active') return;
      void runRevalidation();
    }, REVALIDATION_INTERVAL_MS);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [enabled]);
}
