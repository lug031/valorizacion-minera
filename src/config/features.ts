/**
 * Flags de producto (V1 vs capacidades preparadas en código).
 * Comparación multi-escenario: preparada para futuras versiones comerciales.
 */
export const FEATURES = {
  /** Comparación A/B/C en UI y flujo principal. Desactivado en V1 entregable. */
  scenarioComparison: false,
} as const;

export type AppFeatures = typeof FEATURES;
