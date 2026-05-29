import { FEATURES } from './features';

/** Comparación multi-escenario habilitada a nivel producto. */
export function canUseScenarioComparison(): boolean {
  return FEATURES.scenarioComparison;
}

type ComparisonContext = {
  comparisonEnabled?: boolean;
  scenarios: readonly unknown[];
};

/**
 * UI de comparación visible solo si el flag comercial está activo y el registro
 * tiene más de un escenario. Snapshots históricos con A/B/C siguen cargando
 * internamente; en V1 se muestran como cotización única (escenario activo).
 */
export function isScenarioComparisonUiVisible(ctx: ComparisonContext): boolean {
  if (!canUseScenarioComparison()) return false;
  const enabled = ctx.comparisonEnabled ?? ctx.scenarios.length > 1;
  return enabled && ctx.scenarios.length > 1;
}

/** Índice de escenario principal cuando la UI de comparación está oculta. */
export function primaryScenarioIndex(activeIndex: number, scenarioCount: number): number {
  if (scenarioCount <= 0) return 0;
  return Math.min(Math.max(0, activeIndex), scenarioCount - 1);
}
