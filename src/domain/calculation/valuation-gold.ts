import { Decimal, toDecimal, toDecimalOrZero } from '../../utils/decimal';
import type { NumericInput } from '../../utils/numeric-input';
import { roundHalfUp } from '../../utils/rounding';
import { recPercentToFactor } from './rec-factor';

const MONEY_DECIMAL_PLACES = 2;

export interface ValorAuParams {
  interGold: string | number;
  rcGold: string | number;
  leyGoldOzTc: NumericInput;
  recPercent: string | number;
  maquila: string | number;
  factor: string | number;
  consumos: string | number;
  flete: string | number;
  otrosCostos?: string | number | null;
}

/**
 * valorAu = (((((INTER - RC) * LEY * REC_FACTOR) - MAQUILA) * FACTOR) - CONSUMOS) - FLETE) - OTROS
 * Sin redondeo en pasos intermedios; redondeo final a 2 decimales.
 */
export function calculateValorAuPerTms(params: ValorAuParams): Decimal {
  const recFactor = recPercentToFactor(params.recPercent);
  const otros = params.otrosCostos == null || params.otrosCostos === ''
    ? new Decimal(0)
    : toDecimal(params.otrosCostos);

  const inner = toDecimalOrZero(params.interGold)
    .sub(toDecimalOrZero(params.rcGold))
    .mul(params.leyGoldOzTc)
    .mul(recFactor);

  const afterMaquila = inner.sub(toDecimalOrZero(params.maquila));
  const afterFactor = afterMaquila.mul(toDecimalOrZero(params.factor));

  const raw = afterFactor
    .sub(toDecimalOrZero(params.consumos))
    .sub(toDecimalOrZero(params.flete))
    .sub(otros);

  return roundHalfUp(raw, MONEY_DECIMAL_PLACES);
}
