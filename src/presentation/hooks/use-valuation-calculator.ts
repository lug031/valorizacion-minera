import { useMemo } from 'react';
import { calculateValuation, calculateLotBase } from '../../domain/calculation/valuation-engine';
import { suggestMaquila } from '../../domain/calculation/maquila-suggestion';
import { suggestRcGold } from '../../domain/calculation/rc-suggestion';
import type { MaquilaRange } from '../../domain/models/config';
import type { LotInput, ScenarioCommercialParams, ValuationCalculationResult } from '../../domain/models/calculation';
import { useConfigStore } from '../store/config-store';

export interface UseValuationCalculatorInput {
  lot: LotInput | null;
  scenarios: ScenarioCommercialParams[];
  maquilaRanges?: readonly MaquilaRange[];
  enabled?: boolean;
}

export interface UseValuationCalculatorOutput {
  result: ValuationCalculationResult | null;
  suggestedMaquila: string | null;
  suggestedRcGold: string | null;
  isValid: boolean;
}

/**
 * Único puente UI → dominio. No contiene fórmulas.
 */
export function useValuationCalculator({
  lot,
  scenarios,
  maquilaRanges: rangesProp,
  enabled = true,
}: UseValuationCalculatorInput): UseValuationCalculatorOutput {
  const storeRanges = useConfigStore((s) => s.maquilaRanges);
  const maquilaRanges = rangesProp ?? storeRanges;

  return useMemo(() => {
    if (!enabled || !lot || scenarios.length === 0 || maquilaRanges.length === 0) {
      return { result: null, suggestedMaquila: null, suggestedRcGold: null, isValid: false };
    }

    const base = calculateLotBase(lot);
    if (!base) {
      return { result: null, suggestedMaquila: null, suggestedRcGold: null, isValid: false };
    }

    const suggestedMaquila = suggestMaquila(base.leyGoldOzTc, maquilaRanges);
    const suggestedRcGold = suggestRcGold(base.leyGoldOzTc);
    try {
      const result = calculateValuation(lot, scenarios, maquilaRanges);
      return {
        result,
        suggestedMaquila,
        suggestedRcGold,
        isValid: result != null,
      };
    } catch {
      return { result: null, suggestedMaquila: null, suggestedRcGold: null, isValid: false };
    }
  }, [lot, scenarios, maquilaRanges, enabled]);
}
