import { useEffect } from 'react';
import { router } from 'expo-router';
import { useUsageQuotaStore } from '../store/usage-quota-store';

export function useUsageQuotaGuard(enabled: boolean): void {
  const gateStatus = useUsageQuotaStore((s) => s.gateStatus);
  const isHydrated = useUsageQuotaStore((s) => s.isHydrated);

  useEffect(() => {
    if (!enabled || !isHydrated) return;
    if (gateStatus === 'exceeded') {
      router.replace('/(auth)/usage-blocked');
    }
  }, [enabled, gateStatus, isHydrated]);
}
