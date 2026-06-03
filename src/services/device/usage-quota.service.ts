import { AppState, type AppStateStatus } from 'react-native';
import { DEFAULT_TRIAL_LIMIT_MS } from '../../domain/constants/usage-quota';
import type { DeviceRegistration } from '../../domain/models/user';
import { deviceRepository } from '../../data/repositories';
import { getCloudDeviceId, getEnrollmentMode } from '../../infrastructure/device/enrollment-store';

let activeSinceMs: number | null = null;

function trialLimitMs(device: DeviceRegistration): number {
  const minutes = device.trialLimitMinutes;
  if (typeof minutes === 'number' && minutes > 0 && minutes <= 24 * 60) {
    return minutes * 60 * 1000;
  }
  return DEFAULT_TRIAL_LIMIT_MS;
}

export function isTrialUsageDevice(device: DeviceRegistration | null): boolean {
  return device?.usagePolicy === 'trial';
}

export async function loadBindingDeviceForUsage(): Promise<DeviceRegistration | null> {
  const cloudDeviceId = await getCloudDeviceId();
  if (!cloudDeviceId) return null;
  return deviceRepository.getBindingDevice(cloudDeviceId);
}

export async function syncUsageQuotaFromServer(device: DeviceRegistration): Promise<DeviceRegistration> {
  const resetAt = device.usageQuotaResetAt;
  const cloudDeviceId = device.cloudDeviceId;
  if (!resetAt || !cloudDeviceId) return device;
  if (device.usageQuotaResetAppliedAt === resetAt) return device;

  await deviceRepository.resetUsageAccumulated(cloudDeviceId);
  await deviceRepository.markUsageQuotaResetApplied(cloudDeviceId, resetAt);
  return (await loadBindingDeviceForUsage()) ?? { ...device, usageAccumulatedMs: 0, usageQuotaResetAppliedAt: resetAt };
}

export async function getUsageQuotaSnapshot(): Promise<{
  device: DeviceRegistration | null;
  limitMs: number;
  accumulatedMs: number;
  remainingMs: number;
  exceeded: boolean;
}> {
  const device = await loadBindingDeviceForUsage();
  if (!isTrialUsageDevice(device)) {
    return {
      device,
      limitMs: 0,
      accumulatedMs: 0,
      remainingMs: 0,
      exceeded: false,
    };
  }

  const synced = device ? await syncUsageQuotaFromServer(device) : device;
  const limitMs = synced ? trialLimitMs(synced) : DEFAULT_TRIAL_LIMIT_MS;
  const accumulatedMs = synced?.usageAccumulatedMs ?? 0;
  const remainingMs = Math.max(0, limitMs - accumulatedMs);

  return {
    device: synced,
    limitMs,
    accumulatedMs,
    remainingMs,
    exceeded: accumulatedMs >= limitMs,
  };
}

async function flushActiveSlice(nowMs: number): Promise<void> {
  if (activeSinceMs == null) return;
  const delta = Math.max(0, nowMs - activeSinceMs);
  activeSinceMs = null;
  if (delta === 0) return;

  const cloudDeviceId = await getCloudDeviceId();
  if (!cloudDeviceId) return;
  const device = await deviceRepository.getBindingDevice(cloudDeviceId);
  if (!isTrialUsageDevice(device)) return;

  await deviceRepository.addUsageAccumulatedMs(cloudDeviceId, delta);
}

export async function onAppStateChange(nextState: AppStateStatus): Promise<void> {
  const mode = await getEnrollmentMode();
  if (mode !== 'enrolled') return;

  const nowMs = Date.now();
  if (nextState === 'active') {
    activeSinceMs = nowMs;
    return;
  }
  if (nextState === 'background' || nextState === 'inactive') {
    await flushActiveSlice(nowMs);
  }
}

export function startUsageQuotaTicker(onTick: () => void): () => void {
  const sub = AppState.addEventListener('change', (state) => {
    void onAppStateChange(state).then(onTick);
  });

  if (AppState.currentState === 'active') {
    activeSinceMs = Date.now();
  }

  const interval = setInterval(() => {
    void (async () => {
      if (AppState.currentState === 'active') {
        await flushActiveSlice(Date.now());
        if (AppState.currentState === 'active') {
          activeSinceMs = Date.now();
        }
      }
      onTick();
    })();
  }, 30_000);

  return () => {
    sub.remove();
    clearInterval(interval);
    void flushActiveSlice(Date.now());
  };
}
