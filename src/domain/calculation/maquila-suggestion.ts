import { toDecimal } from '../../utils/decimal';
import type { NumericInput } from '../../utils/numeric-input';
import type { MaquilaRange } from '../models/config';

function activeRanges(ranges: readonly MaquilaRange[]): MaquilaRange[] {
  return ranges.filter((r) => r.isActive !== false);
}

/**
 * Sugiere maquila según ley oro (oz/tc) y tabla de rangos activos sincronizada.
 * Si la ley supera el máximo de la tabla, usa la maquila del último rango activo.
 */
export function suggestMaquila(
  leyGoldOzTc: NumericInput,
  ranges: readonly MaquilaRange[]
): string | null {
  const ley = toDecimal(leyGoldOzTc);
  if (!ley.isFinite() || ley.isNegative()) return null;

  const active = activeRanges(ranges);
  if (active.length === 0) return null;

  const sorted = [...active].sort((a, b) =>
    toDecimal(a.minLeyOzTc).cmp(toDecimal(b.minLeyOzTc))
  );

  const top = sorted[sorted.length - 1];
  const maxLey = toDecimal(top.maxLeyOzTc);
  if (ley.gt(maxLey)) {
    return top.maquila;
  }

  for (const range of sorted) {
    const min = toDecimal(range.minLeyOzTc);
    const max = toDecimal(range.maxLeyOzTc);
    if (ley.gte(min) && ley.lte(max)) {
      return range.maquila;
    }
  }

  return null;
}
