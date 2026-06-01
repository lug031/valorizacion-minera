/**
 * Rutas del flujo de valorización donde se bloquea captura de pantalla.
 * Alineado a expo-router bajo el grupo (app).
 */
export function isValuationSensitiveRoute(segments: readonly string[]): boolean {
  const routeParts = segments.filter((segment) => !segment.startsWith('('));
  const root = routeParts[0];
  if (root === 'valorizacion') return true;
  if (root === 'historial') return true;
  return false;
}
