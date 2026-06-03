import { create } from 'zustand';

export type UsageQuotaGateStatus = 'unknown' | 'standard' | 'allowed' | 'exceeded';

interface UsageQuotaState {
  gateStatus: UsageQuotaGateStatus;
  accumulatedMs: number;
  limitMs: number;
  remainingMs: number;
  isHydrated: boolean;
  setSnapshot: (input: {
    gateStatus: UsageQuotaGateStatus;
    accumulatedMs: number;
    limitMs: number;
    remainingMs: number;
  }) => void;
  reset: () => void;
}

export const useUsageQuotaStore = create<UsageQuotaState>((set) => ({
  gateStatus: 'unknown',
  accumulatedMs: 0,
  limitMs: 0,
  remainingMs: 0,
  isHydrated: false,

  setSnapshot: ({ gateStatus, accumulatedMs, limitMs, remainingMs }) =>
    set({
      gateStatus,
      accumulatedMs,
      limitMs,
      remainingMs,
      isHydrated: true,
    }),

  reset: () =>
    set({
      gateStatus: 'unknown',
      accumulatedMs: 0,
      limitMs: 0,
      remainingMs: 0,
      isHydrated: false,
    }),
}));
