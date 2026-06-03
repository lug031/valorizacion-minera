import { useEffect } from 'react';
import { router } from 'expo-router';
import { getUsageQuotaSnapshot, startUsageQuotaTicker } from '../../services/device/usage-quota.service';
import { useUsageQuotaStore } from '../store/usage-quota-store';

async function refreshUsageQuotaGate(): Promise<void> {
  const snapshot = await getUsageQuotaSnapshot();
  const gateStatus = !snapshot.device
    ? 'unknown'
    : snapshot.device.usagePolicy !== 'trial'
      ? 'standard'
      : snapshot.exceeded
        ? 'exceeded'
        : 'allowed';

  useUsageQuotaStore.getState().setSnapshot({
    gateStatus,
    accumulatedMs: snapshot.accumulatedMs,
    limitMs: snapshot.limitMs,
    remainingMs: snapshot.remainingMs,
  });
}

function navigateIfUsageExceeded(): void {
  const { gateStatus } = useUsageQuotaStore.getState();
  if (gateStatus === 'exceeded') {
    router.replace('/(auth)/usage-blocked');
  }
}

export function useUsageQuotaTracker(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    void refreshUsageQuotaGate().then(navigateIfUsageExceeded);

    const stop = startUsageQuotaTicker(() => {
      void refreshUsageQuotaGate().then(navigateIfUsageExceeded);
    });

    return stop;
  }, [enabled]);
}

export { refreshUsageQuotaGate };
