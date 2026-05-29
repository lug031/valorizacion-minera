import type { MaquilaRange } from '../models/config';
import type { LotInput, ScenarioCommercialParams, ValuationCalculationResult } from '../models/calculation';
import { calculateValuation } from './valuation-engine';

/**
 * Calcula los 3 escenarios comparativos con el mismo lote (sin duplicar reglas).
 */
export function calculateValuationSet(
  lot: LotInput,
  scenarios: readonly ScenarioCommercialParams[],
  maquilaRanges: readonly MaquilaRange[]
): ValuationCalculationResult | null {
  return calculateValuation(lot, scenarios, maquilaRanges);
}
