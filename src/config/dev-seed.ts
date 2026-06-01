/** Usuarios demo (admin/operador) solo en desarrollo, tests o si se habilita explícitamente. */
export function isDevSeedEnabled(): boolean {
  if (typeof __DEV__ !== 'undefined' && __DEV__) return true;
  if (process.env.NODE_ENV === 'test') return true;
  const flag = process.env.EXPO_PUBLIC_ENABLE_DEV_SEED?.trim();
  return flag === 'true' || flag === '1';
}
