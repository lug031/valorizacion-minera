import type { ScenarioCalculationResult } from '../../domain/models/calculation';

export interface ScenarioComparisonRow {
  label: string;
  name: string;
  valorAuPerTms: string;
  valorAgPerTms: string;
  valorFinalPerTms: string;
  valorCompraTotal: string;
  diffTotalVsA: string | null;
}

/**
 * Tabla comparativa vs escenario A (referencia).
 * Feature preparada para futuras versiones comerciales.
 */
export function buildScenarioComparison(
  scenarios: readonly ScenarioCalculationResult[]
): ScenarioComparisonRow[] {
  if (scenarios.length === 0) return [];

  const baseline = parseFloat(scenarios[0].valorCompraTotal);
  return scenarios.map((s, index) => {
    const total = parseFloat(s.valorCompraTotal);
    const diff = index === 0 ? null : (total - baseline).toFixed(2);
    return {
      label: s.label,
      name: s.name,
      valorAuPerTms: s.valorAuPerTms,
      valorAgPerTms: s.valorAgPerTms,
      valorFinalPerTms: s.valorFinalPerTms,
      valorCompraTotal: s.valorCompraTotal,
      diffTotalVsA: diff,
    };
  });
}

export function findBestScenarioTotal(scenarios: readonly ScenarioCalculationResult[]): string {
  if (scenarios.length === 0) return '—';
  let best = scenarios[0];
  for (const s of scenarios) {
    if (parseFloat(s.valorCompraTotal) > parseFloat(best.valorCompraTotal)) {
      best = s;
    }
  }
  return `Escenario ${best.label}`;
}
