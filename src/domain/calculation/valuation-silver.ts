import { Decimal, toDecimalOrZero } from '../../utils/decimal';
import type { NumericInput } from '../../utils/numeric-input';
import { roundHalfUp } from '../../utils/rounding';
import { recPercentToFactor } from './rec-factor';

const MONEY_DECIMAL_PLACES = 2;

export interface ValorAgParams {
  interSilver: string | number;
  rcSilver: string | number;
  leySilverOzTc: NumericInput;
  recPercent: string | number;
  factor: string | number;
}

/**
 * valorAg = ((INTER_AG - RC_AG) * LEY_AG_OZ_TC * REC_FACTOR * FACTOR)
 * No descuenta maquila, consumos ni flete.
 */
export function calculateValorAgPerTms(params: ValorAgParams): Decimal {
  const recFactor = recPercentToFactor(params.recPercent);

  const raw = toDecimalOrZero(params.interSilver)
    .sub(toDecimalOrZero(params.rcSilver))
    .mul(params.leySilverOzTc)
    .mul(recFactor)
    .mul(toDecimalOrZero(params.factor));

  return roundHalfUp(raw, MONEY_DECIMAL_PLACES);
}
