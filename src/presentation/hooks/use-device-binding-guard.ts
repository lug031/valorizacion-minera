import { useEffect } from 'react';
import { router } from 'expo-router';
import { useDeviceBindingStore } from '../store/device-binding-store';

/** Redirige a pantalla de bloqueo cuando el store cambia mientras la app está abierta. */
export function useDeviceBindingGuard(enabled: boolean): void {
  const gateStatus = useDeviceBindingStore((s) => s.gateStatus);
  const isHydrated = useDeviceBindingStore((s) => s.isHydrated);

  useEffect(() => {
    if (!enabled || !isHydrated) return;
    if (gateStatus === 'blocked') {
      router.replace('/(auth)/device-blocked');
    }
  }, [enabled, gateStatus, isHydrated]);
}
