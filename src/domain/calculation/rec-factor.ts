import { Decimal, tryToDecimal, toDecimal } from '../../utils/decimal';
import { REC_PERCENT_DIVISOR } from '../constants/formula';

/**
 * Convierte REC de UI (90, 85) a factor decimal (0.90, 0.85).
 */
export function recPercentToFactor(recPercent: string | number): Decimal {
  return toDecimal(recPercent).div(REC_PERCENT_DIVISOR);
}

export function tryRecPercentToFactor(recPercent: string | number): Decimal | null {
  const pct = tryToDecimal(recPercent);
  if (!pct) return null;
  return pct.div(REC_PERCENT_DIVISOR);
}
