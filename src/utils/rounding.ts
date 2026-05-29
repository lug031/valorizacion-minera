import { Decimal, toDecimal } from './decimal';

/**
 * Equivalente a REDONDEAR.MENOS de Excel: redondeo hacia abajo
 * a la cantidad de decimales indicada.
 */
export function roundDown(
  value: number | string | Decimal,
  decimalPlaces: number
): Decimal {
  return toDecimal(value).toDecimalPlaces(decimalPlaces, Decimal.ROUND_DOWN);
}

/**
 * Redondeo estándar a N decimales (REDONDEAR de Excel).
 * Usado en resultados monetarios finales (2 decimales).
 */
export function roundHalfUp(
  value: number | string | Decimal,
  decimalPlaces: number
): Decimal {
  return toDecimal(value).toDecimalPlaces(decimalPlaces, Decimal.ROUND_HALF_UP);
}
