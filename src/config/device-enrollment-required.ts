import { readPublicEnv } from './runtime-env';

/**
 * En release (sin __DEV__) exige activación con código salvo EXPO_PUBLIC_REQUIRE_DEVICE_ENROLLMENT=false.
 */
export function isDeviceEnrollmentRequired(): boolean {
  if (typeof __DEV__ !== 'undefined' && __DEV__) return false;
  if (process.env.NODE_ENV === 'test') return false;

  const flag = readPublicEnv('EXPO_PUBLIC_REQUIRE_DEVICE_ENROLLMENT');
  if (flag === 'false' || flag === '0') return false;
  if (flag === 'true' || flag === '1') return true;
  return true;
}
