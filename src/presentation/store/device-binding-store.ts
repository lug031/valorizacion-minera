import { create } from 'zustand';
import type { DeviceBindingCheckResult } from '../../services/device-binding.service';

export type DeviceBindingGateStatus = 'unknown' | 'legacy' | 'allowed' | 'blocked';

interface DeviceBindingState {
  gateStatus: DeviceBindingGateStatus;
  checkResult: DeviceBindingCheckResult | null;
  isHydrated: boolean;
  setCheckResult: (result: DeviceBindingCheckResult) => void;
  reset: () => void;
}

function gateFromResult(result: DeviceBindingCheckResult): DeviceBindingGateStatus {
  if (result.ok && result.skipped && result.reason === 'legacy_mode') return 'legacy';
  if (result.ok) return 'allowed';
  return 'blocked';
}

export const useDeviceBindingStore = create<DeviceBindingState>((set) => ({
  gateStatus: 'unknown',
  checkResult: null,
  isHydrated: false,

  setCheckResult: (result) =>
    set({
      checkResult: result,
      gateStatus: gateFromResult(result),
      isHydrated: true,
    }),

  reset: () =>
    set({
      gateStatus: 'unknown',
      checkResult: null,
      isHydrated: false,
    }),
}));
