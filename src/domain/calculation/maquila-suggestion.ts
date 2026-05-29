import { toDecimal } from '../../utils/decimal';
import type { NumericInput } from '../../utils/numeric-input';
import {
  MAQUILA_ABOVE_MAX_SUGGESTION,
  MAQUILA_LEY_MAX_THRESHOLD,
} from '../constants/default-maquila-ranges';
import type { MaquilaRange } from '../models/config';

/**
 * Sugiere maquila según ley oro (oz/tc) y tabla de rangos.
 * Si ley > 1.901 → 190.
 */
export function suggestMaquila(
  leyGoldOzTc: NumericInput,
  ranges: readonly MaquilaRange[]
): string | null {
  const ley = toDecimal(leyGoldOzTc);
  if (!ley.isFinite() || ley.isNegative()) return null;

  const threshold = toDecimal(MAQUILA_LEY_MAX_THRESHOLD);
  if (ley.gt(threshold)) {
    return MAQUILA_ABOVE_MAX_SUGGESTION;
  }

  const sorted = [...ranges].sort((a, b) =>
    toDecimal(a.minLeyOzTc).cmp(toDecimal(b.minLeyOzTc))
  );

  for (const range of sorted) {
    const min = toDecimal(range.minLeyOzTc);
    const max = toDecimal(range.maxLeyOzTc);
    if (ley.gte(min) && ley.lte(max)) {
      return range.maquila;
    }
  }

  return null;
}
