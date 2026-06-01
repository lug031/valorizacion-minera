/** Logs solo en desarrollo; no exponer en APK de piloto/producción. */
export function logDev(...args: unknown[]): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log(...args);
  }
}

export function logDevError(...args: unknown[]): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.error(...args);
  }
}
